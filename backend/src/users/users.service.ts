import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { assertUsernameFormat, normalizeUsername } from './username';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  /**
   * Lista todos los clientes registrados con el conteo de sus citas.
   * Pensado para el panel administrativo del taller.
   */
  async findAllClients() {
    return this.prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista todos los técnicos registrados.
   * Pensado para el panel administrativo del taller (para asignar citas).
   */
  async findAllTechnicians() {
    return this.prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        specialty: true,
        username: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { assignedServices: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  /**
   * Crea un técnico desde el panel del taller.
   * El admin lo valida en persona: queda verificado y activo de inmediato.
   */
  async createTechnician(dto: CreateTechnicianDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese correo electrónico');
    }

    const username = normalizeUsername(dto.username);
    if (username) {
      const formatErr = assertUsernameFormat(username);
      if (formatErr) throw new BadRequestException(formatErr);
      const taken = await this.prisma.user.findUnique({ where: { username } });
      if (taken) throw new ConflictException('Ese nombre de usuario ya está en uso');
    }

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          username: username ?? null,
          password: await this.hashPassword(dto.password),
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          specialty: dto.specialty ?? null,
          role: 'TECHNICIAN',
          isVerified: true,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          specialty: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(this.uniqueConflictMessage(e));
      }
      throw e;
    }
  }

  /**
   * Actualiza los datos de un usuario (panel del taller). Solo cambia lo que se envía.
   */
  async updateUser(id: string, dto: UpdateUserDto) {
    const data: any = {};
    for (const k of ['firstName', 'lastName', 'email', 'phone', 'role', 'specialty'] as const) {
      if (dto[k] !== undefined) data[k] = dto[k];
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) data.password = await this.hashPassword(dto.password);
    if (dto.username !== undefined) {
      const username = normalizeUsername(dto.username);
      if (username) {
        const formatErr = assertUsernameFormat(username);
        if (formatErr) throw new BadRequestException(formatErr);
      }
      data.username = username;
    }
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          specialty: true,
          isActive: true,
          isVerified: true,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException(this.uniqueConflictMessage(e));
      if (e.code === 'P2025') throw new NotFoundException('Usuario no encontrado');
      throw e;
    }
  }

  private uniqueConflictMessage(e: any): string {
    const target = e?.meta?.target;
    const fields = Array.isArray(target) ? target : typeof target === 'string' ? [target] : [];
    if (fields.some((f: string) => String(f).includes('username'))) {
      return 'Ese nombre de usuario ya está en uso';
    }
    return 'Ese correo ya está registrado en otra cuenta';
  }

  /**
   * Elimina un usuario (y en cascada sus citas). Solo para el panel del taller.
   */
  async deleteUser(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { deleted: true };
    } catch (e: any) {
      if (e.code === 'P2025') throw new NotFoundException('Usuario no encontrado');
      throw e;
    }
  }

  /**
   * Solicitud de recuperación: genera un token de 1h y envía el correo con el enlace.
   * Siempre responde igual (no revela si el correo existe) por seguridad.
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      });
      const base = process.env.FRONTEND_URL || 'http://localhost:5174';
      const resetUrl = `${base}/restablecer?token=${token}`;
      await this.mailService.sendPasswordResetEmail(email, resetUrl);
    }
    return { message: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.' };
  }

  /**
   * Restablece la contraseña con un token válido y no expirado.
   */
  async resetPassword(token: string, newPassword: string) {
    if (!token) throw new BadRequestException('Token no proporcionado');
    const user = await this.prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('El enlace es inválido o ya expiró. Solicita uno nuevo.');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await this.hashPassword(newPassword),
        resetToken: null,
        resetTokenExpiry: null,
        isVerified: true, // si reseteó por correo, su correo es válido
      },
    });
    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }

  /**
   * Hashea una contraseña con bcrypt (lento a propósito, resistente a fuerza bruta).
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compara una contraseña en texto plano contra el hash bcrypt almacenado.
   */
  private async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Registra un nuevo usuario en la plataforma.
   * Valida que el correo electrónico no esté duplicado.
   */
  async register(dto: RegisterUserDto) {
    const { email, password, firstName, lastName, phone } = dto;

    // 1. Validar que el correo no esté duplicado
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado');
    }

    // 2. Generar token de verificación único (Magic Link) de 32 bytes
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 3. Hashear la contraseña con bcrypt
    const hashedPassword = await this.hashPassword(password);

    // 4. Crear el usuario en la base de datos
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        verificationCode: verificationToken,
      },
    });

    // 5. Construir el enlace de activación con la URL pública del backend
    const baseUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`;
    const activationUrl = `${baseUrl}/users/verify-link?token=${verificationToken}`;

    // 6. Enviar correo real o simular si no está configurado SMTP
    const sent = await this.mailService.sendVerificationEmail(email, activationUrl);

    if (!sent) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, verificationCode: null },
      });
    }

    return {
      message: sent
        ? 'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico para activar tu cuenta.'
        : 'Usuario registrado exitosamente. Cuenta activada automáticamente (modo offline / desarrollo).',
      userId: user.id,
      email: user.email,
      isVerified: !sent,
      activationUrl,
    };
  }

  /**
   * Verifica la cuenta de usuario mediante el token único.
   * Lanza BadRequestException si el token es inválido o ya expiró.
   */
  async verifyEmailLink(token: string): Promise<boolean> {
    if (!token) {
      throw new BadRequestException('El token de activación no fue proporcionado.');
    }

    const user = await this.prisma.user.findFirst({
      where: { verificationCode: token },
    });

    if (!user) {
      throw new BadRequestException('El enlace de activación es inválido o la cuenta ya fue activada.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
      },
    });

    return true;
  }

  /**
   * Inicia sesión validando credenciales y estado de verificación.
   */
  async login(dto: LoginUserDto) {
    const { password } = dto;
    const identifier = (dto.identifier || dto.email || '').trim();

    // 1. Buscar por email (si tiene @) o por username. No revelar cuál falló.
    const user = identifier.includes('@')
      ? await this.prisma.user.findFirst({
          where: { email: { equals: identifier, mode: 'insensitive' } },
        })
      : await this.prisma.user.findUnique({
          where: { username: identifier.toLowerCase() },
        });

    // 2. Validar usuario y contraseña (bcrypt)
    const passwordOk = user
      ? await this.comparePassword(password, user.password)
      : false;
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Validar si está verificado
    if (!user.isVerified) {
      throw new UnauthorizedException('Debes verificar tu correo electrónico antes de iniciar sesión');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Esta cuenta está desactivada. Contacta al taller.');
    }

    // 4. Emitir token JWT con la identidad y el rol del usuario
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Retornar datos seguros del usuario (sin contraseña) + token
    return {
      message: 'Inicio de sesión exitoso',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        cedula: user.cedula,
        role: user.role,
      },
    };
  }
}
