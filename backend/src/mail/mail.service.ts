import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 3000,
        greetingTimeout: 3000,
      });
      this.logger.log(`SMTP Mailer initialized with host: ${host}`);
    } else {
      this.logger.warn('SMTP credentials not fully configured. Emails will be logged to the console instead.');
    }
  }

  async sendVerificationEmail(to: string, activationUrl: string): Promise<boolean> {
    const from = process.env.SMTP_FROM || '"Fresh Service Digital" <noreply@freshservice.com>';
    const subject = 'Activa tu cuenta — Fresh Service Digital';

    // Contenido HTML estilizado con el diseño "Hielo/Frost" del proyecto
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      background-color: #F0F9FF;
      color: #0C1A26;
      font-family: 'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border: 1px solid #BAE6FD;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(8, 47, 73, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #082F49, #075985);
      padding: 30px;
      text-align: center;
    }
    .logo {
      font-family: 'Exo 2', 'Segoe UI', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #FFFFFF;
      text-decoration: none;
      display: inline-block;
    }
    .logo span {
      color: #38BDF8;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    h1 {
      font-family: 'Exo 2', 'Segoe UI', sans-serif;
      font-size: 22px;
      color: #075985;
      margin-bottom: 20px;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #4A7A9B;
      margin-bottom: 30px;
    }
    .btn {
      display: inline-block;
      padding: 14px 30px;
      background: #0284C7;
      color: #FFFFFF !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
    }
    .btn:hover {
      background: #0270a8;
    }
    .footer {
      background: #F0F9FF;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #4A7A9B;
      border-top: 1px solid #E0F2FE;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">❄️ Fresh<span> Service Digital</span></div>
    </div>
    <div class="content">
      <h1>¡Te damos la bienvenida!</h1>
      <p>Gracias por registrarte en nuestra plataforma de servicios de refrigeración a domicilio. Para comenzar a solicitar tus citas, activa tu cuenta haciendo clic en el siguiente enlace:</p>
      <a href="${activationUrl}" class="btn" target="_blank">Activar mi cuenta ahora ✓</a>
      <p style="margin-top: 30px; font-size: 13px;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${activationUrl}" style="color: #0284C7;">${activationUrl}</a></p>
    </div>
    <div class="footer">
      San Juan de los Morros, Guárico, Venezuela<br>
      © 2026 Fresh Service Digital. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          html: htmlContent,
        });
        this.logger.log(`Verification email sent to: ${to}`);
        return true;
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        return false;
      }
    } else {
      this.logger.log(`\n======================================================`);
      this.logger.log(`📬 [SIMULACIÓN DE CORREO] Enlace de Verificación`);
      this.logger.log(`Para: ${to}`);
      this.logger.log(`Enlace: ${activationUrl}`);
      this.logger.log(`======================================================\n`);
      return false;
    }
  }
}
