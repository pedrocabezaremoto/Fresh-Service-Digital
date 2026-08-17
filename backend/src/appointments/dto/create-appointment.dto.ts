import { IsNotEmpty, IsOptional, IsString, IsInt, IsISO8601, IsNumber } from 'class-validator';

export class CreateAppointmentDto {
  @IsString({ message: 'El ID del cliente debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  clientId: string;

  @IsISO8601({}, { message: 'La fecha agendada debe tener un formato de fecha válido (ISO 8601)' })
  @IsNotEmpty({ message: 'La fecha de la cita es requerida' })
  scheduledAt: string;

  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsOptional()
  notes?: string;

  @IsString({ message: 'La marca del equipo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La marca del equipo es requerida' })
  brand: string;

  @IsString({ message: 'El modelo del equipo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El modelo del equipo es requerido' })
  model: string;

  @IsInt({ message: 'La capacidad en BTU debe ser un número entero' })
  @IsOptional()
  btuCapacity?: number;

  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsOptional()
  priceUsd?: number;

  @IsString({ message: 'El ID del servicio debe ser texto' })
  @IsOptional()
  serviceId?: string;

  @IsString({ message: 'La cédula debe ser texto' })
  @IsOptional()
  cedula?: string;

  @IsString({ message: 'La descripción de la falla es requerida' })
  @IsNotEmpty({ message: 'La descripción de la falla o servicio es requerida' })
  failureDescription: string;

  /** Coordenadas del domicilio del servicio (opcionales; si se envía una, deben ir ambas). */
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @IsOptional()
  latitude?: number;

  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @IsOptional()
  longitude?: number;

  /** Dirección textual del servicio (puede ir sola o junto con coordenadas). */
  @IsString({ message: 'La dirección debe ser texto' })
  @IsOptional()
  address?: string;
}
