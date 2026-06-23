import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea una nueva cita de servicio y asocia el equipo de refrigeración de forma transaccional.
   */
  async create(dto: CreateAppointmentDto) {
    const { clientId, scheduledAt, notes, brand, model, btuCapacity, failureDescription } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Crear la cita
      const appointment = await tx.appointment.create({
        data: {
          clientId,
          scheduledAt: new Date(scheduledAt),
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
   * Obtiene todas las citas de la base de datos, incluyendo la relación
   * con el cliente (User) y sus equipos asociados (Equipment).
   */
  async findAll() {
    return this.prisma.appointment.findMany({
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
}
