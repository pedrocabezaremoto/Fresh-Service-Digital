import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(AppointmentStatus, {
    message:
      'El estado debe ser uno de: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED',
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  status: AppointmentStatus;
}
