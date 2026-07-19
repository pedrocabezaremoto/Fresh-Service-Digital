import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
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
   * Crea una nueva cita de servicio y asocia el equipo de refrigeración de forma transaccional.
   */
  async create(dto: CreateAppointmentDto) {
    const { clientId, scheduledAt, notes, brand, model, btuCapacity, failureDescription, priceUsd, cedula } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Recordar la cédula en la cuenta del cliente (para precargarla la próxima vez)
      if (cedula) {
        await tx.user.update({ where: { id: clientId }, data: { cedula } });
      }
      // 1. Crear la cita
      const appointment = await tx.appointment.create({
        data: {
          clientId,
          scheduledAt: new Date(scheduledAt),
          priceUsd: priceUsd ?? null,
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
   * Obtiene todas las citas de la base de datos (con filtrado si el rol es TECHNICIAN),
   * incluyendo la relación con el cliente (User), técnico asignado (User) y sus equipos asociados (Equipment).
   */
  async findAll(user?: any) {
    const where: any = {};
    if (user && user.role === 'TECHNICIAN') {
      where.OR = [
        { technicianId: user.sub },
        { technicianId: null, status: AppointmentStatus.PENDING },
      ];
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Completa una cita cambiando su estado a COMPLETED.
   */
  async completeAppointment(appointmentId: string) {
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.COMPLETED },
    });
  }

  /**
   * Cambia el estado de una cita a cualquier estado válido.
   * Usado por el panel del taller para gestionar el flujo de trabajo.
   */
  async updateStatus(appointmentId: string, status: AppointmentStatus) {
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
}
