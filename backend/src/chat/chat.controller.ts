import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('status')
  async getStatus() {
    return this.chatService.getStatus();
  }

  @Post()
  async chat(@Req() req: Request, @Res() res: Response) {
    const { sessionId, message } = req.body as { sessionId?: string; message?: string };

    if (!sessionId || typeof sessionId !== 'string' || !message || typeof message !== 'string' || message.trim().length === 0) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Mensaje inválido.' })}\n\n`);
      res.end();
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '0.0.0.0';

    const result = await this.chatService.handleChat(
      sessionId,
      message.trim(),
      clientIp,
      (token) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'token', value: token })}\n\n`);
        }
      },
    );

    if ('error' in result) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: result.error })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'done', conversationId: result.conversationId })}\n\n`);
    }

    if (!res.writableEnded) res.end();
  }
}
