import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  /**
   * Lista todos los clientes registrados con el conteo de sus citas.
   * Pensado para el panel administrativo del taller.
   */
  async findAllClients() {
    return this.prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista todos los técnicos registrados.
   * Pensado para el panel administrativo del taller (para asignar citas).
   */
  async findAllTechnicians() {
    return this.prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  /**
   * Hashea una contraseña con bcrypt (lento a propósito, resistente a fuerza bruta).
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compara una contraseña en texto plano contra el hash bcrypt almacenado.
   */
  private async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
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

    // 2. Generar token de verificación único (Magic Link) de 32 bytes
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 3. Hashear la contraseña con bcrypt
    const hashedPassword = await this.hashPassword(password);

    // 4. Crear el usuario en la base de datos
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        verificationCode: verificationToken,
      },
    });

    // 5. Construir el enlace de activación con la URL pública del backend
    const baseUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`;
    const activationUrl = `${baseUrl}/users/verify-link?token=${verificationToken}`;

    // 6. Enviar correo real o simular si no está configurado SMTP
    const sent = await this.mailService.sendVerificationEmail(email, activationUrl);

    if (!sent) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, verificationCode: null },
      });
    }

    return {
      message: sent
        ? 'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico para activar tu cuenta.'
        : 'Usuario registrado exitosamente. Cuenta activada automáticamente (modo offline / desarrollo).',
      userId: user.id,
      email: user.email,
      isVerified: !sent,
      activationUrl,
    };
  }

  /**
   * Verifica la cuenta de usuario mediante el token único.
   * Lanza BadRequestException si el token es inválido o ya expiró.
   */
  async verifyEmailLink(token: string): Promise<boolean> {
    if (!token) {
      throw new BadRequestException('El token de activación no fue proporcionado.');
    }

    const user = await this.prisma.user.findFirst({
      where: { verificationCode: token },
    });

    if (!user) {
      throw new BadRequestException('El enlace de activación es inválido o la cuenta ya fue activada.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
      },
    });

    return true;
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

    // 2. Validar usuario y contraseña (bcrypt)
    const passwordOk = user
      ? await this.comparePassword(password, user.password)
      : false;
    if (!user || !passwordOk) {
      throw new UnauthorizedException('El correo o la contraseña son incorrectos');
    }

    // 3. Validar si está verificado
    if (!user.isVerified) {
      throw new UnauthorizedException('Debes verificar tu correo electrónico antes de iniciar sesión');
    }

    // 4. Emitir token JWT con la identidad y el rol del usuario
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Retornar datos seguros del usuario (sin contraseña) + token
    return {
      message: 'Inicio de sesión exitoso',
      accessToken,
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
