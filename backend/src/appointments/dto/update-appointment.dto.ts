import { IsOptional, IsString, IsNumber } from 'class-validator';

/**
 * Actualización parcial de una cita.
 * Pensado sobre todo para ubicación (lat/lng/address): un cliente puede
 * tener distintas direcciones por solicitud.
 */
export class UpdateAppointmentDto {
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @IsOptional()
  latitude?: number;

  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @IsOptional()
  longitude?: number;

  @IsString({ message: 'La dirección debe ser texto' })
  @IsOptional()
  address?: string;
}
