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
      <img src="https://fresh.pedroservicios.xyz/copito-avatar.png" alt="Fresh Service" width="46" height="46" style="display:inline-block;vertical-align:middle;border-radius:10px;background:#ffffff;padding:4px" />
      <span style="vertical-align:middle;margin-left:10px;font-size:22px;font-weight:800;color:#ffffff;font-family:'Exo 2','Segoe UI',sans-serif">Fresh<span style="color:#38BDF8"> Service Digital</span></span>
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
          text: `Te damos la bienvenida a Fresh Service Digital.\n\nActiva tu cuenta abriendo este enlace:\n${activationUrl}\n\nSan Juan de los Morros, Guárico, Venezuela.`,
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

  /**
   * Aviso al cliente de que su servicio fue asignado a un técnico, con el precio (proforma).
   */
  async sendServiceAssignedEmail(
    to: string,
    d: {
      clientName: string;
      service: string;
      ref: string;
      priceUsd: number;
      priceBs: string | null;
      technicianName: string;
      technicianPhone: string | null;
      panelUrl: string;
    },
  ): Promise<boolean> {
    const from = process.env.SMTP_FROM || '"Fresh Service Digital" <noreply@freshservice.com>';
    const subject = `Tu servicio fue asignado — Ref #${d.ref}`;
    const montoBs = d.priceBs ? `${d.priceBs}` : `$${d.priceUsd}`;
    const waLink = d.technicianPhone
      ? `https://wa.me/${d.technicianPhone.replace(/\D/g, '')}`
      : null;

    const htmlContent = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
  body{background:#F0F9FF;color:#0C1A26;font-family:'Segoe UI',Tahoma,sans-serif;margin:0;padding:0}
  .container{max-width:600px;margin:40px auto;background:#fff;border:1px solid #BAE6FD;border-radius:16px;overflow:hidden}
  .header{background:linear-gradient(135deg,#082F49,#075985);padding:26px;text-align:center}
  .logo{font-size:22px;font-weight:800;color:#fff}.logo span{color:#38BDF8}
  .content{padding:32px 30px}
  h1{font-size:20px;color:#075985;margin:0 0 14px}
  p{font-size:15px;line-height:1.6;color:#4A7A9B;margin:0 0 14px}
  .box{background:#F0F9FF;border:1px solid #E0F2FE;border-radius:12px;padding:18px;margin:18px 0}
  .row{font-size:14px;color:#0C1A26;margin:6px 0}
  .total{font-size:22px;font-weight:800;color:#075985}
  .btn{display:inline-block;padding:12px 26px;background:#0284C7;color:#fff!important;text-decoration:none;border-radius:8px;font-weight:700}
  .footer{background:#F0F9FF;padding:18px;text-align:center;font-size:12px;color:#4A7A9B;border-top:1px solid #E0F2FE}
</style></head><body>
  <div class="container">
    <div class="header">
      <img src="https://fresh.pedroservicios.xyz/copito-avatar.png" alt="Fresh Service" width="42" height="42" style="display:inline-block;vertical-align:middle;border-radius:9px;background:#ffffff;padding:4px" />
      <span style="vertical-align:middle;margin-left:9px;font-size:20px;font-weight:800;color:#ffffff">Fresh<span style="color:#38BDF8"> Service</span></span>
    </div>
    <div class="content">
      <h1>¡Tu servicio fue asignado, ${d.clientName}!</h1>
      <p>Un técnico ya está asignado a tu solicitud. Aquí tienes el detalle:</p>
      <div class="box">
        <div class="row"><strong>Servicio:</strong> ${d.service}</div>
        <div class="row"><strong>Referencia:</strong> #${d.ref}</div>
        <div class="row"><strong>Técnico:</strong> ${d.technicianName}${d.technicianPhone ? ` · ${d.technicianPhone}` : ''}</div>
        <div class="row" style="margin-top:12px"><strong>Total a pagar:</strong> <span class="total">${montoBs}</span></div>
        <div class="row" style="font-size:12px;color:#4A7A9B">Ref. $${d.priceUsd} · monto en Bs sujeto a la tasa oficial del BCV del día de pago.</div>
      </div>
      <p>Puedes ver el estado y <strong>descargar tu proforma</strong> desde tu panel:</p>
      <p style="text-align:center"><a href="${d.panelUrl}" class="btn" target="_blank">Ver mi panel</a></p>
      ${waLink ? `<p style="text-align:center;font-size:13px">O contacta a tu técnico por <a href="${waLink}" style="color:#059669">WhatsApp</a>.</p>` : ''}
    </div>
    <div class="footer">San Juan de los Morros, Guárico, Venezuela<br>© 2026 Fresh Service Digital</div>
  </div>
</body></html>`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from, to, subject, html: htmlContent,
          text: `Tu servicio fue asignado, ${d.clientName}.\n\nServicio: ${d.service}\nReferencia: #${d.ref}\nTécnico: ${d.technicianName}${d.technicianPhone ? ' · ' + d.technicianPhone : ''}\nTotal a pagar: ${montoBs} (Ref. $${d.priceUsd})\n\nVer tu panel: ${d.panelUrl}\n\nFresh Service Digital — San Juan de los Morros, Venezuela.`,
        });
        this.logger.log(`Correo de asignación enviado a: ${to}`);
        return true;
      } catch (error) {
        this.logger.error(`Falló el correo de asignación a ${to}: ${error.message}`);
        return false;
      }
    }
    this.logger.log(`\n📬 [SIMULACIÓN] Servicio asignado → ${to} | ${d.service} | Total: ${montoBs} | Técnico: ${d.technicianName}\n`);
    return false;
  }

  /**
   * Correo para restablecer la contraseña (enlace con token de 1h).
   */
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const from = process.env.SMTP_FROM || '"Fresh Service Digital" <noreply@freshservice.com>';
    const subject = 'Restablece tu contraseña — Fresh Service Digital';
    const htmlContent = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
  body{background:#F0F9FF;color:#0C1A26;font-family:'Segoe UI',Tahoma,sans-serif;margin:0;padding:0}
  .container{max-width:600px;margin:40px auto;background:#fff;border:1px solid #BAE6FD;border-radius:16px;overflow:hidden}
  .header{background:linear-gradient(135deg,#082F49,#075985);padding:26px;text-align:center}
  .content{padding:32px 30px;text-align:center}
  h1{font-size:20px;color:#075985}p{font-size:15px;line-height:1.6;color:#4A7A9B}
  .btn{display:inline-block;padding:13px 30px;background:#0284C7;color:#fff!important;text-decoration:none;border-radius:8px;font-weight:700}
  .footer{background:#F0F9FF;padding:18px;text-align:center;font-size:12px;color:#4A7A9B;border-top:1px solid #E0F2FE}
</style></head><body>
  <div class="container">
    <div class="header">
      <img src="https://fresh.pedroservicios.xyz/copito-avatar.png" alt="Fresh Service" width="46" height="46" style="display:inline-block;vertical-align:middle;border-radius:10px;background:#fff;padding:4px" />
      <span style="vertical-align:middle;margin-left:10px;font-size:22px;font-weight:800;color:#fff">Fresh<span style="color:#38BDF8"> Service Digital</span></span>
    </div>
    <div class="content">
      <h1>Restablece tu contraseña</h1>
      <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva. El enlace vence en 1 hora.</p>
      <p><a href="${resetUrl}" class="btn" target="_blank">Crear nueva contraseña</a></p>
      <p style="font-size:13px">Si no fuiste tú, ignora este correo; tu contraseña no cambiará.</p>
    </div>
    <div class="footer">San Juan de los Morros, Guárico, Venezuela<br>© 2026 Fresh Service Digital</div>
  </div>
</body></html>`;
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from, to, subject, html: htmlContent,
          text: `Restablece tu contraseña de Fresh Service Digital abriendo este enlace (vence en 1 hora):\n${resetUrl}\n\nSi no lo solicitaste, ignora este correo.`,
        });
        this.logger.log(`Correo de reseteo enviado a: ${to}`);
        return true;
      } catch (error) {
        this.logger.error(`Falló el correo de reseteo a ${to}: ${error.message}`);
        return false;
      }
    }
    this.logger.log(`\n📬 [SIMULACIÓN] Reset de contraseña → ${to}\nEnlace: ${resetUrl}\n`);
    return false;
  }
}

