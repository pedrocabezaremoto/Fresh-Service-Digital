import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export const SERVICE_CATEGORIES = [
  'MANTENIMIENTO',
  'REPARACION',
  'INSTALACION',
  'DIAGNOSTICO',
  'RECARGA',
  'OTRO',
] as const;

export const EQUIPMENT_TYPES = [
  'VENTANA',
  'SPLIT',
  'TONELADA_1',
  'TONELADA_2',
  'TONELADA_3',
  'GENERAL',
] as const;

export class CreateServiceDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name: string;

  @IsIn([...SERVICE_CATEGORIES], { message: 'Categoría no válida' })
  @IsNotEmpty({ message: 'La categoría es requerida' })
  category: (typeof SERVICE_CATEGORIES)[number];

  @IsIn([...EQUIPMENT_TYPES], { message: 'Tipo de equipo no válido' })
  @IsNotEmpty({ message: 'El tipo de equipo es requerido' })
  equipmentType: (typeof EQUIPMENT_TYPES)[number];

  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  priceUsd: number;

  @IsString({ message: 'La descripción debe ser texto' })
  @IsOptional()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El orden debe ser un número entero' })
  sortOrder?: number;
}
