import { IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class LoginUserDto {
  /** Login nuevo: email o username. */
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'El correo o nombre de usuario es requerido' })
  @IsNotEmpty({ message: 'El correo o nombre de usuario es requerido' })
  identifier?: string;

  /** Compatibilidad: clientes/front viejo siguen enviando email. */
  @ValidateIf((o) => !o.identifier)
  @IsString({ message: 'El correo o nombre de usuario es requerido' })
  @IsNotEmpty({ message: 'El correo o nombre de usuario es requerido' })
  email?: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
