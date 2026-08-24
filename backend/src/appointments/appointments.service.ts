import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { MailService } from '../mail/mail.service';
import { RateService } from '../rate/rate.service';
import { priceUsd as derivePriceUsd } from '../common/prices';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger('AppointmentsService');

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private rate: RateService,
  ) {}

  /**
   * Valida pares lat/lng: ambas o ninguna; rangos geográficos válidos.
   * `address` puede ir sola o junto con coordenadas.
   */
  private assertLocationFields(latitude?: number | null, longitude?: number | null) {
    const hasLat = latitude !== undefined && latitude !== null;
    const hasLng = longitude !== undefined && longitude !== null;

    if (hasLat !== hasLng) {
      throw new BadRequestException(
        'Si envía coordenadas, debe incluir latitud y longitud',
      );
    }

    if (hasLat && hasLng) {
      if (latitude! < -90 || latitude! > 90) {
        throw new BadRequestException('La latitud debe estar entre -90 y 90');
      }
      if (longitude! < -180 || longitude! > 180) {
        throw new BadRequestException('La longitud debe estar entre -180 y 180');
      }
    }
  }

  /**
   * Crea una nueva cita de servicio y asocia el equipo de refrigeración de forma transaccional.
   */
  async create(dto: CreateAppointmentDto) {
    const {
      clientId,
      scheduledAt,
      notes,
      brand,
      model,
      btuCapacity,
      failureDescription,
      priceUsd,
      serviceId,
      cedula,
      latitude,
      longitude,
      address,
    } = dto;

    this.assertLocationFields(latitude, longitude);

    return this.prisma.$transaction(async (tx) => {
      // Si viene serviceId, el precio lo fija el catálogo (no se confía en el frontend)
      let resolvedPrice = priceUsd ?? null;
      let resolvedServiceId: string | null = null;
      if (serviceId) {
        const service = await tx.service.findUnique({ where: { id: serviceId } });
        if (!service) {
          throw new BadRequestException('El servicio indicado no existe');
        }
        if (!service.isActive) {
          throw new BadRequestException('Este servicio no está disponible');
        }
        resolvedPrice = service.priceUsd;
        resolvedServiceId = service.id;
      }

      // Recordar la cédula en la cuenta del cliente (para precargarla la próxima vez)
      if (cedula) {
        await tx.user.update({ where: { id: clientId }, data: { cedula } });
      }
      // 1. Crear la cita
      const appointment = await tx.appointment.create({
        data: {
          clientId,
          scheduledAt: new Date(scheduledAt),
          priceUsd: resolvedPrice,
          serviceId: resolvedServiceId,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          address: address ?? null,
          notes,
          status: AppointmentStatus.PENDING,
        },
      });

      // 2. Crear el equipo asociado a la cita
      await tx.equipment.create({
        data: {
          appointmentId: appointment.id,
          brand,
          model,
          btuCapacity: btuCapacity ? Number(btuCapacity) : null,
          failureDescription,
        },
      });

      return appointment;
    });
  }

  /**
   * Actualiza campos de ubicación de una cita existente (parcial).
   */
  async update(appointmentId: string, dto: UpdateAppointmentDto) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!existing) {
      throw new NotFoundException('Cita no encontrada');
    }

    // Si solo llega un lado del par, fusionar con lo ya guardado para validar el resultado final
    const nextLat =
      dto.latitude !== undefined ? dto.latitude : existing.latitude;
    const nextLng =
      dto.longitude !== undefined ? dto.longitude : existing.longitude;

    this.assertLocationFields(nextLat, nextLng);

    const data: {
      latitude?: number | null;
      longitude?: number | null;
      address?: string | null;
    } = {};
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.address !== undefined) data.address = dto.address;

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data,
    });
  }

  /**
   * Obtiene las citas. ADMIN ve todas.
   * TECHNICIAN solo ve las que el taller le asignó (technicianId = él).
   * Nunca ve PENDING sin asignar — eso es exclusivo del panel del taller.
   */
  async findAll(user?: any) {
    const where: any = {};
    if (user && user.role === 'TECHNICIAN') {
      where.technicianId = user.sub;
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            cedula: true,
            role: true,
          },
        },
        technician: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
        equipment: true,
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /** El técnico solo puede operar sobre citas que el taller le asignó. */
  private async assertTechnicianOwns(appointmentId: string, user?: any) {
    if (!user || user.role !== 'TECHNICIAN') return;
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { technicianId: true },
    });
    if (!appointment || appointment.technicianId !== user.sub) {
      throw new ForbiddenException(
        'Esta solicitud no está asignada a ti. Solo el taller puede asignarla.',
      );
    }
  }

  /**
   * Obtiene el historial de citas de un cliente específico, incluyendo sus equipos.
   */
  async findByClient(clientId: string) {
    return this.prisma.appointment.findMany({
      where: { clientId },
      include: {
        equipment: true,
        technician: {
          select: { firstName: true, lastName: true, phone: true },
        },
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Completa una cita cambiando su estado a COMPLETED.
   */
  async completeAppointment(appointmentId: string, user?: any) {
    await this.assertTechnicianOwns(appointmentId, user);
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.COMPLETED },
    });
  }

  /**
   * Cambia el estado de una cita a cualquier estado válido.
   * Usado por el panel del taller para gestionar el flujo de trabajo.
   */
  async updateStatus(appointmentId: string, status: AppointmentStatus, user?: any) {
    await this.assertTechnicianOwns(appointmentId, user);
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });
  }

  /**
   * Asigna un técnico a una cita. Si se pasa un técnico y el estado era PENDING,
   * se actualiza automáticamente a ASSIGNED.
   */
  async assignTechnician(appointmentId: string, technicianId: string | null) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (technicianId) {
      const tech = await this.prisma.user.findUnique({
        where: { id: technicianId },
        select: { id: true, role: true, isActive: true },
      });
      if (!tech || tech.role !== 'TECHNICIAN') {
        throw new BadRequestException('El técnico indicado no existe');
      }
      if (!tech.isActive) {
        throw new BadRequestException('No se puede asignar un técnico inactivo');
      }
    }

    const data: any = { technicianId };
    if (technicianId && appointment && appointment.status === AppointmentStatus.PENDING) {
      data.status = AppointmentStatus.ASSIGNED;
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
        technician: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
        equipment: true,
        service: true,
      },
    });

    // Aviso por correo al cliente (proforma). No bloquea ni rompe la asignación si falla.
    if (technicianId && updated.client?.email && updated.technician) {
      void this.notifyAssigned(updated).catch((e) =>
        this.logger.warn(`No se pudo enviar el correo de asignación: ${e.message}`),
      );
    }

    return updated;
  }

  private async notifyAssigned(appt: any) {
    const eq = appt.equipment?.[0];
    const usd = appt.priceUsd ?? derivePriceUsd(eq?.brand, eq?.model);
    const rate = this.rate.getRate().rate;
    const priceBs = rate
      ? 'Bs ' + (usd * rate).toLocaleString('es-VE', { maximumFractionDigits: 2 })
      : null;
    const base = process.env.PUBLIC_WEB_URL || 'https://fresh.pedroservicios.xyz';
    await this.mail.sendServiceAssignedEmail(appt.client.email, {
      clientName: appt.client.firstName,
      service: eq ? `${eq.brand} · ${eq.model}` : 'Servicio',
      ref: appt.id.substring(0, 8).toUpperCase(),
      priceUsd: usd,
      priceBs,
      technicianName: `${appt.technician.firstName} ${appt.technician.lastName}`,
      technicianPhone: appt.technician.phone || null,
      panelUrl: `${base}/panel`,
    });
  }

  /**
   * Cita rápida desde el chat en vivo: vincula cliente por teléfono
   * o crea un usuario guest. No requiere schema nuevo.
   */
  async createQuickFromChat(data: {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    serviceId?: string;
    scheduledAt: string;
    notes?: string;
    sessionId?: string;
  }) {
    let phone = data.clientPhone.replace(/[^\d+]/g, '');
    if (phone.startsWith('0')) phone = '+58' + phone.slice(1);
    if (!phone.startsWith('+')) phone = '+58' + phone;

    let client = await this.prisma.user.findFirst({
      where: { phone },
    });

    // Si no lo encontro por telefono pero tiene email, buscar por email
    if (!client && data.clientEmail?.trim()) {
      client = await this.prisma.user.findFirst({
        where: { email: data.clientEmail.trim() },
      });
    }

    if (!client) {
      const nameParts = data.clientName.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Chat';
      const randomSuffix = Math.random().toString(36).slice(2, 8);
      const guestEmail = data.clientEmail?.trim() || `chat-${randomSuffix}@guest.local`;
      client = await this.prisma.user.create({
        data: {
          email: guestEmail,
          password: '$2b$10$placeholder_not_usable_for_login',
          firstName,
          lastName,
          phone,
          role: 'CLIENT',
          isVerified: false,
        },
      });
    } else if (
      data.clientEmail?.trim() &&
      client.email.endsWith('@guest.local')
    ) {
      try {
        client = await this.prisma.user.update({
          where: { id: client.id },
          data: { email: data.clientEmail.trim() },
        });
      } catch {
        // email ya tomado: se deja el guest y se sigue con la cita
      }
    }

    let priceUsd: number | null = null;
    let equipBrand = 'Por definir';
    let equipModel = 'Por definir';
    let resolvedServiceId: string | null = null;
    if (data.serviceId) {
      const svc = await this.prisma.service.findUnique({ where: { id: data.serviceId } });
      if (svc) {
        priceUsd = svc.priceUsd;
        equipBrand = svc.name;
        equipModel = svc.equipmentType || 'General';
        resolvedServiceId = svc.id;
      }
    }

    const notes =
      data.notes ||
      (data.sessionId
        ? `Agendada desde chat (sesion ${data.sessionId})`
        : 'Agendada desde chat en vivo');

    const appointment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          clientId: client.id,
          scheduledAt: new Date(data.scheduledAt),
          priceUsd,
          serviceId: resolvedServiceId,
          notes,
        },
      });

      await tx.equipment.create({
        data: {
          appointmentId: created.id,
          brand: equipBrand,
          model: equipModel,
          btuCapacity: 0,
          failureDescription: data.notes || 'Servicio agendado desde chat en vivo',
        },
      });

      return created;
    });

    return {
      ...appointment,
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
      },
    };
  }
}
