import { Injectable, Logger } from '@nestjs/common';
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService, type LlmChatMessage } from './llm.service';
import { ChatTelegramService } from './chat-telegram.service';
import { ChatGateway } from './chat.gateway';
import { Prisma } from '@prisma/client';

// Sharp 0.35: types ESM-first, runtime CJS. require() is the callable factory.
const sharp = require('sharp');
const heicConvert = require('heic-convert');

const MAX_TOOL_ROUNDS = 3;

const CHAT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'guardar_contacto',
      description: 'Guarda los datos del visitante para que el taller lo contacte. Úsala EN CUANTO tengas nombre y al menos un medio de contacto (teléfono o email).',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre del visitante' },
          telefono: { type: 'string', description: 'Teléfono en formato internacional (+58...)' },
          email: { type: 'string', description: 'Correo electrónico' },
          servicio: {
            type: 'string',
            description: 'Tipo de servicio que necesita (ej: Mantenimiento, Reparación, Recarga de Gas, etc.)',
          },
          resumen: { type: 'string', description: 'Qué necesita el visitante (máximo 300 caracteres)' },
        },
        required: ['nombre', 'servicio', 'resumen'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_servicios',
      description: 'Consulta los servicios disponibles y sus precios desde la base de datos. Úsala cuando el visitante pregunte por precios o servicios disponibles.',
      parameters: {
        type: 'object',
        properties: {
          tipo_equipo: {
            type: 'string',
            description: 'Tipo de equipo: slug en mayúsculas (ej: VENTANA, SPLIT, NEVERA). Opcional; sin filtro devuelve todos.',
          },
        },
        required: [],
      },
    },
  },
];

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private consecutiveFailures = 0;
  private disabledUntilMs = 0;
  private readonly budgetLimit = parseFloat(process.env.CHATBOT_MONTHLY_BUDGET_USD || '5');
  private readonly maxMsgsPerConversation = parseInt(process.env.CHATBOT_MAX_MESSAGES_PER_CONVERSATION || '10', 10);
  private readonly dailyRateLimit = parseInt(process.env.CHATBOT_RATE_LIMIT_DAILY || '60', 10);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly telegram: ChatTelegramService,
    private readonly gateway: ChatGateway,
  ) {}

  async archiveConversation(id: string) {
    await this.prisma.chatConversation.update({
      where: { id },
      data: { archived: true },
    });
    return { success: true };
  }

  async unarchiveConversation(id: string) {
    await this.prisma.chatConversation.update({
      where: { id },
      data: { archived: false },
    });
    return { success: true };
  }

  async deleteConversation(id: string) {
    const imageMessages = await this.prisma.chatMessage.findMany({
      where: { conversationId: id, type: 'image' },
      select: { imageUrl: true },
    });

    const uploadDir = join(process.cwd(), 'uploads', 'chat-images');
    for (const msg of imageMessages) {
      if (msg.imageUrl) {
        const filename = msg.imageUrl.split('/').pop();
        if (filename && !filename.includes('..')) {
          const filePath = join(uploadDir, filename);
          try {
            if (existsSync(filePath)) unlinkSync(filePath);
          } catch {
            this.logger.warn(`No se pudo borrar imagen: ${filename}`);
          }
        }
      }
    }

    await this.prisma.chatMessage.deleteMany({ where: { conversationId: id } });
    await this.prisma.chatConversation.delete({ where: { id } });
    return { success: true };
  }

  async getArchivedConversations() {
    const convs = await this.prisma.chatConversation.findMany({
      where: { archived: true },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    return convs.map(c => ({
      id: c.id,
      sessionId: c.sessionId,
      operatorActive: c.operatorActive,
      operatorName: c.operatorName,
      unreadByAdmin: c.unreadByAdmin,
      messageCount: c.messageCount,
      lastMessageAt: c.lastMessageAt,
      startedAt: c.startedAt,
      lastMessage: c.messages[0] || null,
      paused: c.paused,
      blocked: c.blocked,
      archived: c.archived,
    }));
  }

  async getConversationMessages(conversationId: string) {
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, type: true, imageUrl: true, createdAt: true },
    });
  }

  private publicBase() {
    return process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`;
  }

  private saveChatImage(filename: string, buffer: Buffer) {
    const uploadDir = join(process.cwd(), 'uploads', 'chat-images');
    mkdirSync(uploadDir, { recursive: true });
    writeFileSync(join(uploadDir, filename), buffer);
    return `${this.publicBase()}/uploads/chat-images/${filename}`;
  }

  private async toJpegBuffer(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer, { unlimited: true, limitInputPixels: false })
        .jpeg({ quality: 80 })
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    } catch (err) {
      this.logger.warn(`Sharp no pudo convertir (${err}). Intento heic-convert.`);
    }

    try {
      const jpeg = await heicConvert({ buffer, format: 'JPEG', quality: 0.8 });
      return await sharp(Buffer.from(jpeg))
        .jpeg({ quality: 80 })
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    } catch (err) {
      this.logger.warn(`heic-convert tampoco pudo, se guarda el original: ${err}`);
      return buffer;
    }
  }

  async handleImageUpload(
    sessionId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    req: any,
  ): Promise<{ url: string; messageId: string } | { error: string }> {
    if (!sessionId) return { error: 'Sesión inválida.' };
    if (!file?.buffer?.length) return { error: 'No se adjuntó ningún archivo.' };

    if (file.mimetype && !file.mimetype.startsWith('image/')) {
      return { error: 'Solo se permiten archivos de imagen.' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { error: 'La imagen no puede superar 5 MB.' };
    }

    let conversation = await this.prisma.chatConversation.findUnique({ where: { sessionId } });
    if (!conversation) {
      const clientIp = (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '0.0.0.0';
      conversation = await this.prisma.chatConversation.create({
        data: { sessionId, ipHash: this.hashIp(clientIp) },
      });
    }
    if (conversation.blocked) return { error: 'Esta conversación ha sido bloqueada.' };
    if (conversation.paused) return { error: 'Esta conversación está pausada.' };
    if (conversation.imageCount >= 5) return { error: 'Máximo 5 imágenes por conversación.' };

    const processedBuffer = await this.toJpegBuffer(file.buffer);
    const filename = `${conversation.id}-${Date.now()}.jpg`;
    const imageUrl = this.saveChatImage(filename, processedBuffer);

    const msg = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: '[Imagen]',
        type: 'image',
        imageUrl,
      },
    });

    await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: {
        imageCount: { increment: 1 },
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
    });

    await this.gateway.notifyNewClientMessage(sessionId, {
      id: msg.id,
      role: 'user',
      content: '[Imagen]',
      type: 'image',
      imageUrl,
      createdAt: msg.createdAt,
    });

    return { url: imageUrl, messageId: msg.id };
  }

  async handleOperatorImageUpload(
    conversationId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ): Promise<{ url: string; messageId: string } | { error: string }> {
    if (!conversationId) return { error: 'Conversación inválida.' };
    if (!file?.buffer?.length) return { error: 'No se adjuntó ningún archivo.' };

    if (file.mimetype && !file.mimetype.startsWith('image/')) {
      return { error: 'Solo se permiten archivos de imagen.' };
    }

    const conversation = await this.prisma.chatConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return { error: 'Conversación no encontrada.' };

    const processedBuffer = await this.toJpegBuffer(file.buffer);
    const filename = `op-${conversationId}-${Date.now()}.jpg`;
    const imageUrl = this.saveChatImage(filename, processedBuffer);

    const msg = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'operator',
        content: '[Imagen]',
        type: 'image',
        imageUrl,
      },
    });

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { messageCount: { increment: 1 }, lastMessageAt: new Date() },
    });

    this.gateway.server.to(`session:${conversation.sessionId}`).emit('message', {
      id: msg.id,
      role: 'operator',
      content: '[Imagen]',
      type: 'image',
      imageUrl,
      createdAt: msg.createdAt,
      operatorName: 'Operador',
    });

    this.gateway.server.to('operators').emit('message', {
      sessionId: conversation.sessionId,
      id: msg.id,
      role: 'operator',
      content: '[Imagen]',
      type: 'image',
      imageUrl,
      createdAt: msg.createdAt,
      operatorName: 'Operador',
    });

    return { url: imageUrl, messageId: msg.id };
  }

  async getStatus(): Promise<{ enabled: boolean; reason?: string }> {
    if (!this.llm.isConfigured()) return { enabled: false, reason: 'not_configured' };
    if (this.isCircuitOpen()) return { enabled: false, reason: 'circuit_open' };
    if (await this.isBudgetExceeded()) return { enabled: false, reason: 'budget_exceeded' };
    return { enabled: true };
  }

  private isCircuitOpen(): boolean {
    if (this.disabledUntilMs > 0 && Date.now() >= this.disabledUntilMs) {
      this.disabledUntilMs = 0;
      this.consecutiveFailures = 0;
    }
    return Date.now() < this.disabledUntilMs;
  }

  private recordSuccess(): void { this.consecutiveFailures = 0; }

  private recordFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= 3) {
      this.disabledUntilMs = Date.now() + 5 * 60 * 1000;
      this.consecutiveFailures = 0;
    }
  }

  private async isBudgetExceeded(): Promise<boolean> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const agg = await this.prisma.chatConversation.aggregate({
      _sum: { estimatedCostUsd: true },
      where: { startedAt: { gte: startOfMonth } },
    });
    const sum = agg._sum.estimatedCostUsd;
    return sum ? new Prisma.Decimal(sum).toNumber() >= this.budgetLimit : false;
  }

  private buildSystemPrompt(): string {
    const now = new Date();
    const timeZone = 'America/Caracas';
    const weekday = new Intl.DateTimeFormat('es-VE', { timeZone, weekday: 'long' }).format(now);
    const day = new Intl.DateTimeFormat('es-VE', { timeZone, day: 'numeric' }).format(now);
    const month = new Intl.DateTimeFormat('es-VE', { timeZone, month: 'long' }).format(now);
    const year = new Intl.DateTimeFormat('es-VE', { timeZone, year: 'numeric' }).format(now);
    const time = new Intl.DateTimeFormat('es-VE', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);

    return `Eres Copito, el asistente virtual de Fresh Service Digital, un taller de refrigeración y aires acondicionados a domicilio en San Juan de los Morros, estado Guárico, Venezuela.

PERSONALIDAD:
- Amable, profesional y directo. Hablas en español venezolano natural (tuteas).
- Respuestas CORTAS: máximo 2-3 frases. No repitas información que ya dijiste.
- Tono cálido pero profesional.

COMPORTAMIENTO CON TROLLS Y GROSERÍAS:
- Si el visitante dice groserías, insultos o tonterías: NO te rías, NO le sigas el juego, NO des explicaciones largas.
- Responde UNA sola vez de forma firme y corta: "Eso no es un nombre/mensaje apropiado. ¿Necesitas algún servicio de refrigeración?"
- Si insiste con groserías después de tu advertencia, responde SOLO: "Si necesitas un servicio de refrigeración, con gusto te ayudo. Si no, te deseo un buen día."
- No gastes más de 2 mensajes con alguien que no tiene intención real de pedir un servicio.

SERVICIOS QUE OFRECEMOS:
- Diagnóstico de fallas en aires acondicionados y neveras
- Mantenimiento preventivo (limpieza, revisión general)
- Reparación de equipos
- Recarga de gas refrigerante
- Instalación de equipos nuevos (ventana, split, por toneladas)
- Cambio de componentes: capacitores, termostatos, ventiladores, luces, gomas de puertas
- Instalación de compresores
- Cambio de parrillas (modelos viejos)

TIPOS DE EQUIPOS:
- Aires de Ventana: residencial, económico
- Aires Split: residencial/comercial (interior + exterior)
- Aires por Toneladas (3 a 5 TON): comercial, grandes locales
- Neveras y refrigeradores domésticos

PRECIOS:
- En dólares (USD), se pagan al cambio del día en bolívares (BCV).
- Usa la herramienta consultar_servicios para precios REALES de la base de datos.
- NUNCA inventes precios. Si no hay dato, di que el taller dará presupuesto personalizado.
- Toneladas NO tienen precio público — requieren cotización personalizada.

CAPTURA DE LEADS Y CÓMO PEDIR SERVICIO:
- Tu objetivo principal es capturar nombre, teléfono Y tipo de servicio del visitante.
- Cuando el visitante muestre interés o pregunte por un servicio, PRIMERO pregúntale qué tipo de servicio necesita: mantenimiento, reparación, instalación, recarga de gas, etc. Usa la herramienta consultar_servicios para darle precios reales.
- DESPUÉS de saber qué servicio quiere, pídele su nombre y número de WhatsApp.
- Explícale el proceso RESUMIDO: "Para solicitar un servicio: 1) Me dices qué necesitas, 2) Déjame tu nombre y WhatsApp, 3) El taller te contacta para coordinar fecha y hora, 4) El técnico va a tu domicilio."
- Usa guardar_contacto en cuanto tengas nombre + teléfono o email + tipo de servicio.
- Si NO quiere registrarse, ofrécele dejar un mensaje: "También puedes dejarme un mensaje con lo que necesitas y el taller se comunicará contigo apenas lo vea."
- No insistas más de una vez si no quieren dar datos.

REGLAS ESTRICTAS:
- Solo hablas de refrigeración, aires acondicionados, neveras y servicios relacionados.
- Si preguntan por otra cosa, responde CORTO: "Solo atiendo consultas de refrigeración y aires acondicionados."
- No des consejos de reparación peligrosos (gas refrigerante, electricidad).
- Si la pregunta es compleja, sugiere visita técnica a domicilio.
- Zona de cobertura: San Juan de los Morros y alrededores (Guárico).

CONTEXTO TEMPORAL:
Hoy es ${weekday} ${day} de ${month} de ${year}. Hora en Venezuela: ${time}.

WHATSAPP DEL TALLER: +58 416-376-6075 (solo si el visitante lo pide).`;
  }

  private async executeGuardarContacto(args: any, conversationId: string, ipHash: string): Promise<string> {
    if (!args.nombre || args.nombre.trim().length < 2) {
      return JSON.stringify({ ok: false, error: 'Falta el nombre real del visitante. Pregúntaselo.' });
    }
    const placeholders = ['pendiente', 'sin nombre', 'desconocido', 'cliente', 'usuario', 'visitante', 'n/a', 'null', 'test', 'prueba'];
    if (placeholders.includes(args.nombre.trim().toLowerCase())) {
      return JSON.stringify({ ok: false, error: 'Ese no es un nombre real. Pregúntale su nombre al visitante.' });
    }

    // Filtro de groserías
    const profanity = ['culo', 'puta', 'puto', 'verga', 'coño', 'mierda', 'marica', 'pendejo', 'pendeja', 'huevon', 'idiota', 'estupido', 'estupida', 'cabron', 'cabrona', 'malparido', 'malparida', 'gonorrea', 'hijueputa', 'mamaguevo', 'guevo', 'pajuo', 'pajua', 'webon', 'mmgvo', 'imbecil', 'maldito', 'maldita', 'bastardo', 'bastarda', 'ass', 'fuck', 'shit', 'dick', 'bitch'];
    const nameLower = args.nombre.trim().toLowerCase();
    const nameWords = nameLower.split(/\s+/);
    const hasProfanity = nameWords.some(w => profanity.includes(w)) || profanity.some(p => nameLower === p);
    if (hasProfanity) {
      return JSON.stringify({ ok: false, error: 'Ese nombre no es apropiado. Pregúntale su nombre real al visitante.' });
    }

    if (!args.telefono && !args.email) {
      return JSON.stringify({ ok: false, error: 'Se requiere teléfono o email. Pregúntale al visitante.' });
    }

    // Validar formato de teléfono venezolano
    if (args.telefono) {
      const cleanPhone = args.telefono.replace(/[\s\-\(\)\.]/g, '');
      const vzlaRegex = /^(\+?58)?(0?4(12|14|16|24|26)\d{7})$/;
      if (!vzlaRegex.test(cleanPhone)) {
        return JSON.stringify({ ok: false, error: 'El número de teléfono no parece venezolano. Debe empezar con +58 o 04XX seguido de 7 dígitos. Pídele al visitante un número válido.' });
      }
      const match = cleanPhone.match(vzlaRegex);
      if (match) {
        const local = match[2].startsWith('0') ? match[2].slice(1) : match[2];
        args.telefono = '+58' + local;
      }
    }

    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return JSON.stringify({ ok: false, error: 'Conversación no encontrada' });

    if (conversation.leadId) {
      await this.prisma.chatLead.update({
        where: { id: conversation.leadId },
        data: {
          name: args.nombre.trim(),
          phone: args.telefono || null,
          email: args.email || null,
          serviceInterest: args.servicio || null,
          message: args.resumen || null,
        },
      });
      return JSON.stringify({ ok: true, updated: true, message: 'Contacto actualizado' });
    }

    const lead = await this.prisma.chatLead.create({
      data: {
        name: args.nombre.trim(),
        phone: args.telefono || null,
        email: args.email || null,
        serviceInterest: args.servicio || null,
        message: args.resumen || null,
        source: 'chat',
        ipHash,
      },
    });

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { leadId: lead.id, wasConverted: true },
    });

    this.telegram.notifyNewLead({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      serviceInterest: lead.serviceInterest,
      message: lead.message,
    }).catch(err => this.logger.error(`Telegram notify error: ${err}`));

    try {
      this.gateway.notifyNewLead({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        serviceInterest: lead.serviceInterest,
        message: lead.message,
        createdAt: lead.createdAt,
      });
    } catch (err) {
      this.logger.warn(`Socket newLead error: ${(err as Error).message}`);
    }

    return JSON.stringify({ ok: true, leadId: lead.id, message: 'Contacto guardado. El taller será notificado.' });
  }

  private async executeConsultarServicios(args: any): Promise<string> {
    const where: any = { isActive: true };
    if (args.tipo_equipo) {
      const slug = String(args.tipo_equipo).toUpperCase();
      const matchingTypes = await this.prisma.equipmentTypeOption.findMany({
        where: { slug: { startsWith: slug }, isActive: true },
      });
      if (matchingTypes.length > 0) {
        where.equipmentType = { in: matchingTypes.map((t) => t.slug) };
      } else {
        where.equipmentType = slug;
      }
    }

    const services = await this.prisma.service.findMany({
      where,
      select: { name: true, category: true, equipmentType: true, priceUsd: true, description: true },
      orderBy: [{ equipmentType: 'asc' }, { sortOrder: 'asc' }],
    });

    if (!services.length) {
      return JSON.stringify({ ok: true, services: [], texto: 'No hay servicios registrados para ese tipo de equipo.' });
    }

    const eqTypes = await this.prisma.equipmentTypeOption.findMany({ where: { isActive: true } });
    const eqMap = Object.fromEntries(eqTypes.map((t) => [t.slug, t.label]));
    const catTypes = await this.prisma.serviceCategoryOption.findMany({ where: { isActive: true } });
    const catMap = Object.fromEntries(catTypes.map((c) => [c.slug, c.label]));

    const formatted = services.map((s) => ({
      servicio: s.name,
      categoria: catMap[s.category] || s.category,
      equipo: eqMap[s.equipmentType] || s.equipmentType,
      precio_usd: s.equipmentType.startsWith('TONELADA') ? null : s.priceUsd,
      precio: s.equipmentType.startsWith('TONELADA') ? 'cotización personalizada' : `$${s.priceUsd}`,
      descripcion: s.description || undefined,
    }));

    return JSON.stringify({ ok: true, services: formatted });
  }

  private async executeTool(name: string, argsJson: string, conversationId: string, ipHash: string): Promise<string> {
    let args: any;
    try { args = JSON.parse(argsJson); } catch { return JSON.stringify({ ok: false, error: 'JSON inválido' }); }

    switch (name) {
      case 'guardar_contacto':
        return this.executeGuardarContacto(args, conversationId, ipHash);
      case 'consultar_servicios':
        return this.executeConsultarServicios(args);
      default:
        return JSON.stringify({ ok: false, error: `Herramienta desconocida: ${name}` });
    }
  }

  private hashIp(ip: string): string {
    // Hash simple para anonimizar IP sin dependencias
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'ip_' + Math.abs(hash).toString(36);
  }

  async handleChat(
    sessionId: string,
    userMessage: string,
    clientIp: string,
    onToken: (token: string) => void,
  ): Promise<{ conversationId: string } | { error: string }> {
    const ipHash = this.hashIp(clientIp);

    let conversation = await this.prisma.chatConversation.findUnique({ where: { sessionId } });
    if (!conversation) {
      conversation = await this.prisma.chatConversation.create({ data: { sessionId, ipHash } });
    }

    if (conversation.blocked) {
      return { error: 'Esta conversación ha sido cerrada.' };
    }
    if (conversation.paused) {
      return { error: 'Conversación pausada. El operador te contactará pronto.' };
    }

    const trimmedMessage = userMessage.slice(0, 500);

    // Si el operador tomó control, NO usar la IA
    if (conversation.operatorActive) {
      const userMsg = await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'user', content: trimmedMessage },
      });
      await this.prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date(), messageCount: { increment: 1 } },
      });
      await this.gateway.notifyNewClientMessage(sessionId, {
        id: userMsg.id, role: 'user', content: userMsg.content, createdAt: userMsg.createdAt,
      });
      return { conversationId: conversation.id };
    }

    if (!this.llm.isConfigured()) return { error: 'El chat no está disponible ahora. Escríbenos por WhatsApp.' };
    if (this.isCircuitOpen()) return { error: 'El chat no está disponible ahora. Escríbenos por WhatsApp.' };
    if (await this.isBudgetExceeded()) return { error: 'El chat no está disponible ahora. Escríbenos por WhatsApp.' };

    const userCount = await this.prisma.chatMessage.count({
      where: { conversationId: conversation.id, role: 'user' },
    });
    if (userCount >= this.maxMsgsPerConversation) {
      return { error: 'Ya conversamos bastante por aquí. Escríbenos por WhatsApp: +58 416-376-6075' };
    }

    // Rate limit diario por IP
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyCount = await this.prisma.chatMessage.count({
      where: { role: 'user', createdAt: { gte: since }, conversation: { ipHash } },
    });
    if (dailyCount >= this.dailyRateLimit) {
      return { error: 'Has enviado muchos mensajes hoy. Intenta mañana o escríbenos por WhatsApp.' };
    }

    const userMsg = await this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: trimmedMessage },
    });
    await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), messageCount: { increment: 1 } },
    });
    await this.gateway.notifyNewClientMessage(sessionId, {
      id: userMsg.id, role: 'user', content: userMsg.content, createdAt: userMsg.createdAt,
    });

    // Cargar historial
    const historyRows = await this.prisma.chatMessage.findMany({
      where: { conversationId: conversation.id, role: { in: ['user', 'assistant'] } },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { role: true, content: true },
    });
    const history = historyRows.reverse().filter(r => r.content.trim().length > 0)
      .map(r => ({ role: r.role as 'user' | 'assistant', content: r.content }));

    const messages: LlmChatMessage[] = [
      { role: 'system', content: this.buildSystemPrompt() },
      ...history,
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    let assistantContent = '';
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let toolRounds = 0;

    try {
      while (true) {
        const result = await this.llm.streamCompletion({
          messages,
          tools: CHAT_TOOLS,
          onToken,
          signal: controller.signal,
        });

        totalTokensIn += result.tokensIn;
        totalTokensOut += result.tokensOut;

        if (result.toolCalls.length === 0) {
          assistantContent = result.content;
          break;
        }

        if (toolRounds >= MAX_TOOL_ROUNDS) {
          assistantContent = 'Disculpa, tuve un problema. Escríbenos por WhatsApp: +58 416-376-6075';
          onToken(assistantContent);
          break;
        }

        messages.push({
          role: 'assistant',
          content: result.content.length > 0 ? result.content : null,
          tool_calls: result.toolCalls,
        });

        for (const tc of result.toolCalls) {
          const toolResult = await this.executeTool(
            tc.function.name, tc.function.arguments,
            conversation.id, ipHash,
          );
          await this.prisma.chatMessage.create({
            data: { conversationId: conversation.id, role: 'tool', content: `${tc.function.name}: ${toolResult}` },
          });
          messages.push({ role: 'tool', tool_call_id: tc.id, content: toolResult });
        }
        toolRounds++;
      }

      this.recordSuccess();
      const cost = this.llm.computeCostUsd(totalTokensIn, totalTokensOut);

      const assistantMsg = await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'assistant', content: assistantContent, tokensIn: totalTokensIn, tokensOut: totalTokensOut },
      });
      await this.prisma.chatConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
          estimatedCostUsd: { increment: new Prisma.Decimal(cost.toFixed(6)) },
        },
      });
      await this.gateway.notifyAiResponse(sessionId, {
        id: assistantMsg.id, role: 'assistant', content: assistantMsg.content, createdAt: assistantMsg.createdAt,
      });

      this.logger.log(`Chat OK: ${totalTokensIn}in/${totalTokensOut}out, $${cost.toFixed(6)}, ${toolRounds} tool rounds`);
      return { conversationId: conversation.id };

    } catch (err) {
      this.recordFailure();
      this.logger.error(`Chat LLM error: ${err}`);
      return { error: 'No pude responder ahora. Escríbenos por WhatsApp: +58 416-376-6075' };
    } finally {
      clearTimeout(timeout);
    }
  }
}
