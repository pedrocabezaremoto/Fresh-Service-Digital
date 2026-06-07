import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Hashea una contraseña usando el algoritmo nativo SHA-256.
   */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Registra un nuevo usuario en la plataforma.
   * Valida que el correo electrónico no esté duplicado.
   */
  async register(dto: RegisterUserDto) {
    const { email, password, firstName, lastName, phone } = dto;

    // 1. Validar que el correo no esté duplicado
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado');
    }

    // 2. Generar código de verificación simulado de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hashear la contraseña de forma nativa
    const hashedPassword = this.hashPassword(password);

    // 4. Crear el usuario en la base de datos
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        verificationCode,
      },
    });

    // 5. Imprimir el código de verificación por consola para desarrollo
    console.log(`\n======================================================`);
    console.log(`📬 [SIMULACIÓN DE CORREO] Código de Verificación`);
    console.log(`Para: ${email}`);
    console.log(`Código: ${verificationCode}`);
    console.log(`======================================================\n`);

    return {
      message: 'Usuario registrado exitosamente. Por favor, verifica tu correo con el código enviado.',
      userId: user.id,
      email: user.email,
    };
  }

  /**
   * Verifica la cuenta de usuario mediante el código de 6 dígitos.
   */
  async verifyEmail(dto: VerifyUserDto) {
    const { email, code } = dto;

    // 1. Buscar al usuario
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('El usuario no existe');
    }

    // 2. Validar si ya está verificado
    if (user.isVerified) {
      throw new BadRequestException('Esta cuenta ya ha sido verificada');
    }

    // 3. Validar el código de verificación
    if (user.verificationCode !== code) {
      throw new BadRequestException('El código de verificación es incorrecto');
    }

    // 4. Activar la cuenta
    await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null, // Limpiar el código usado
      },
    });

    return {
      message: 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.',
    };
  }

  /**
   * Inicia sesión validando credenciales y estado de verificación.
   */
  async login(dto: LoginUserDto) {
    const { email, password } = dto;

    // 1. Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 2. Validar usuario y contraseña
    if (!user || user.password !== this.hashPassword(password)) {
      throw new UnauthorizedException('El correo o la contraseña son incorrectos');
    }

    // 3. Validar si está verificado
    if (!user.isVerified) {
      throw new UnauthorizedException('Debes verificar tu correo electrónico antes de iniciar sesión');
    }

    // 4. Retornar datos seguros del usuario (sin contraseña)
    return {
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
