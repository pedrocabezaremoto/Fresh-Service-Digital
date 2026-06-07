import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Completa una cita y descuenta el stock de repuestos utilizados.
   * Si cualquiera de los dos pasos falla, la base de datos hace rollback automático.
   */
  async completeAppointment(appointmentId: string, usedParts: { partId: string; quantity: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      
      // 1. Cambiar el estado de la cita a COMPLETED
      const appointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      });

      // 2. Registrar el uso de repuestos y actualizar stock
      for (const part of usedParts) {
        // Consultar el stock actual
        const sparePart = await tx.sparePart.findUnique({
          where: { id: part.partId },
        });

        if (!sparePart) {
          throw new BadRequestException(`El repuesto solicitado no existe: ID ${part.partId}`);
        }

        if (sparePart.stock < part.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para el repuesto: ${sparePart.name}. Disponible: ${sparePart.stock}`
          );
        }

        // Restar stock en la tabla spare_parts
        await tx.sparePart.update({
          where: { id: part.partId },
          data: { stock: { decrement: part.quantity } },
        });

        // Registrar la asignación en la tabla part_assignments
        await tx.partAssignment.create({
          data: {
            appointmentId: appointmentId,
            partId: part.partId,
            quantity: part.quantity,
          },
        });
      }

      return appointment;
    });
  }
}
