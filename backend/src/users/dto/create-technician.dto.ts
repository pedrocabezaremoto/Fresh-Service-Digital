import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

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
}
