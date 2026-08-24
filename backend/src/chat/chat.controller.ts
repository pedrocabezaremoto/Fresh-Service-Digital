import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  async getStatus() {
    return this.chatService.getStatus();
  }

  @Get('archived')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getArchivedConversations() {
    return this.chatService.getArchivedConversations();
  }

  @Get('leads/unread')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getUnreadLeads() {
    return this.prisma.chatLead.findMany({
      where: { readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  @Patch('leads/:id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async markLeadRead(@Param('id') id: string) {
    return this.prisma.chatLead.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getMessages(@Param('id') id: string) {
    return this.chatService.getConversationMessages(id);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async archiveConversation(@Param('id') id: string) {
    return this.chatService.archiveConversation(id);
  }

  @Patch(':id/unarchive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async unarchiveConversation(@Param('id') id: string) {
    return this.chatService.unarchiveConversation(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteConversation(@Param('id') id: string) {
    return this.chatService.deleteConversation(id);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @Req() req: Request,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    @Body() body: { sessionId: string },
  ) {
    return this.chatService.handleImageUpload(body.sessionId, file, req);
  }

  @Post('operator-upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async operatorUploadImage(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    @Body() body: { conversationId: string },
  ) {
    return this.chatService.handleOperatorImageUpload(body.conversationId, file);
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
