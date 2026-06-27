import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
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

    return {
      message: 'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico para activar tu cuenta.',
      userId: user.id,
      email: user.email,
      // Solo devolvemos activationUrl si no se pudo enviar el correo real (modo de simulación offline)
      ...(!sent ? { activationUrl } : {}),
    };
  }

  /**
   * Verifica la cuenta de usuario mediante el token único y retorna una página HTML con el resultado.
   */
  async verifyEmailLink(token: string): Promise<string> {
    const renderHtml = (isSuccess: boolean, errorMessage?: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificación de Cuenta — Fresh Service Digital</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --white:        #FFFFFF;
      --ice-50:       #F0F9FF;
      --ice-100:      #E0F2FE;
      --ice-200:      #BAE6FD;
      --blue-400:     #38BDF8;
      --blue-600:     #0284C7;
      --blue-800:     #075985;
      --blue-950:     #082F49;
      --text-900:     #0C1A26;
      --text-500:     #4A7A9B;
    }
    body {
      background: linear-gradient(135deg, var(--blue-950), var(--blue-800));
      color: var(--white);
      font-family: 'Nunito', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: var(--white);
      color: var(--text-900);
      border-radius: 16px;
      padding: 40px 30px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 10px 25px rgba(8, 47, 73, 0.3);
      text-align: center;
      border: 1px solid var(--ice-200);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 6px;
      background: linear-gradient(90deg, var(--blue-400), var(--blue-600));
    }
    .icon-container {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: var(--ice-50);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 32px;
      border: 2px solid var(--ice-100);
      color: var(--blue-600);
    }
    .icon-container.error {
      background: #FEF2F2;
      border-color: #FEE2E2;
      color: #EF4444;
    }
    h1 {
      font-family: 'Exo 2', sans-serif;
      font-weight: 800;
      font-size: 24px;
      color: var(--blue-800);
      margin: 0 0 12px 0;
      letter-spacing: -0.01em;
    }
    h1.error {
      color: #991B1B;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-500);
      margin: 0 0 28px 0;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 14px 20px;
      background: var(--blue-600);
      color: var(--white);
      text-decoration: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      box-sizing: border-box;
      transition: background 0.2s, transform 0.1s;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
      cursor: pointer;
    }
    .btn:hover {
      background: #0270a8;
    }
    .btn:active {
      transform: scale(0.98);
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: var(--text-500);
    }
    .logo {
      font-family: 'Exo 2', sans-serif;
      font-weight: 800;
      color: var(--blue-800);
      margin-bottom: 20px;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .logo span {
      color: var(--blue-600);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">❄️ Fresh<span> Service Digital</span></div>
    
    ${isSuccess ? `
      <div class="icon-container">✓</div>
      <h1>¡Cuenta Activada con Éxito!</h1>
      <p>Tu correo electrónico ha sido verificado satisfactoriamente. Ya puedes volver a la pestaña de la aplicación e iniciar sesión para comenzar.</p>
      <button onclick="window.close()" class="btn">Cerrar pestaña</button>
    ` : `
      <div class="icon-container error">✗</div>
      <h1 class="error">Error de Verificación</h1>
      <p>${errorMessage || 'El enlace de verificación no es válido o ya ha sido utilizado.'}</p>
      <button onclick="window.close()" class="btn">Cerrar pestaña</button>
    `}
    
    <div class="footer">San Juan de los Morros, Venezuela</div>
  </div>
</body>
</html>
`;

    if (!token) {
      return renderHtml(false, 'El token de verificación no fue proporcionado.');
    }

    // 1. Buscar al usuario por token
    const user = await this.prisma.user.findFirst({
      where: { verificationCode: token },
    });

    if (!user) {
      return renderHtml(false, 'El enlace de activación es inválido o la cuenta ya fue activada.');
    }

    // 2. Activar la cuenta del usuario
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null, // Limpiar el token
      },
    });

    return renderHtml(true);
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
