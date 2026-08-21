import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChatTelegramService {
  private readonly logger = new Logger(ChatTelegramService.name);
  private readonly token = process.env.CHATBOT_TELEGRAM_BOT_TOKEN || '';
  private readonly chatId = process.env.CHATBOT_TELEGRAM_CHAT_ID || '';

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async notifyNewLead(lead: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    serviceInterest: string | null;
    message: string | null;
  }): Promise<boolean> {
    if (!this.token || !this.chatId) return false;

    const phone = lead.phone || '—';
    const email = lead.email || '—';
    const service = lead.serviceInterest || '—';
    const msg = lead.message ? (lead.message.length > 300 ? lead.message.slice(0, 300) + '…' : lead.message) : '—';

    const text = [
      '❄️ <b>Nuevo lead — Copito</b>',
      `🌐 fresh.pedroservicios.xyz`,
      '',
      `👤 <b>${this.escapeHtml(lead.name)}</b>`,
      `📱 ${this.escapeHtml(phone)}`,
      `📧 ${this.escapeHtml(email)}`,
      `🔧 ${this.escapeHtml(service)}`,
      '',
      `💬 <i>${this.escapeHtml(msg)}</i>`,
      '',
      `🆔 <code>${lead.id}</code>`,
    ].join('\n');

    const whatsappPhone = (lead.phone || '').replace(/\D/g, '');
    const whatsappUrl = whatsappPhone
      ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hola ${lead.name}, soy del equipo de Fresh Service Digital. Vi tu consulta sobre ${service}.`)}`
      : `https://wa.me/584163766075`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: '💬 Responder por WhatsApp', url: whatsappUrl }]],
          },
        }),
        signal: AbortSignal.timeout(8000),
      });
      const body = await res.json();
      if (!body.ok) {
        this.logger.error(`Telegram error: ${body.description}`);
        return false;
      }
      this.logger.log(`Lead notificado por Telegram: ${lead.name}`);
      return true;
    } catch (err) {
      this.logger.error(`Telegram fetch error: ${err}`);
      return false;
    }
  }
}
