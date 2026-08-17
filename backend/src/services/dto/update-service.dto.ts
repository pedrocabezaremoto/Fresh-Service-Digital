import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { EQUIPMENT_TYPES, SERVICE_CATEGORIES } from './create-service.dto';

export class UpdateServiceDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name?: string;

  @IsOptional()
  @IsIn([...SERVICE_CATEGORIES], { message: 'Categoría no válida' })
  category?: (typeof SERVICE_CATEGORIES)[number];

  @IsOptional()
  @IsIn([...EQUIPMENT_TYPES], { message: 'Tipo de equipo no válido' })
  equipmentType?: (typeof EQUIPMENT_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  priceUsd?: number;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser verdadero o falso' })
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El orden debe ser un número entero' })
  sortOrder?: number;
}
