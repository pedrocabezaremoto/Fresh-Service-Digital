import { IsOptional, IsString, IsEmail, IsEnum, IsBoolean, IsIn, Matches, MinLength, ValidateIf } from 'class-validator';
import { Role } from '@prisma/client';
import { TECH_SPECIALTIES } from './create-technician.dto';
import { USERNAME_MESSAGE, USERNAME_REGEX } from '../username';

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail({}, { message: 'Correo inválido' }) email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEnum(Role, { message: 'Rol inválido' }) role?: Role;
  @IsOptional() @IsIn([...TECH_SPECIALTIES], { message: 'Especialidad no válida' }) specialty?: string;
  @IsOptional() @IsBoolean({ message: 'isActive debe ser verdadero o falso' }) isActive?: boolean;
  @IsOptional() @IsString() @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' }) password?: string;

  /** Vacío ("") quita el username. Si viene con valor, debe cumplir el formato. */
  @IsOptional()
  @IsString({ message: 'El nombre de usuario debe ser texto' })
  @ValidateIf((_, v) => typeof v === 'string' && v.trim() !== '')
  @Matches(USERNAME_REGEX, { message: USERNAME_MESSAGE })
  username?: string;
}
