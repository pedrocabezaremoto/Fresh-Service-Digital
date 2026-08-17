import { IsOptional, IsString, IsEmail, IsEnum, IsBoolean, IsIn, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { TECH_SPECIALTIES } from './create-technician.dto';

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail({}, { message: 'Correo inválido' }) email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEnum(Role, { message: 'Rol inválido' }) role?: Role;
  @IsOptional() @IsIn([...TECH_SPECIALTIES], { message: 'Especialidad no válida' }) specialty?: string;
  @IsOptional() @IsBoolean({ message: 'isActive debe ser verdadero o falso' }) isActive?: boolean;
  @IsOptional() @IsString() @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' }) password?: string;
}
