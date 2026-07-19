import { IsOptional, IsString, IsEmail, IsEnum, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail({}, { message: 'Correo inválido' }) email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEnum(Role, { message: 'Rol inválido' }) role?: Role;
  @IsOptional() @IsString() @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' }) password?: string;
}
