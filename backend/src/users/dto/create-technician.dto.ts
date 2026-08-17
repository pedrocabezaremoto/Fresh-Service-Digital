import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import { USERNAME_MESSAGE, USERNAME_REGEX } from '../username';

export const TECH_SPECIALTIES = [
  'Aires de Ventana',
  'Aires Split',
  'Aires de 1 Tonelada',
  'Aires de 2 Toneladas',
  'Aires de 3 Toneladas',
  'General',
] as const;

export class CreateTechnicianDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  firstName: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  lastName: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsIn([...TECH_SPECIALTIES], { message: 'Especialidad no válida' })
  specialty?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de usuario debe ser texto' })
  @ValidateIf((_, v) => typeof v === 'string' && v.trim() !== '')
  @Matches(USERNAME_REGEX, { message: USERNAME_MESSAGE })
  username?: string;
}
