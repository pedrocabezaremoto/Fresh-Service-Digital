import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/live-chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  // Track connected operators and clients
  private operators = new Map<string, Socket>(); // socketId -> socket
  private clients = new Map<string, Socket>();   // sessionId -> socket

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth?.token;
    const sessionId = socket.handshake.auth?.sessionId;

    if (token) {
      // Operator connecting - validate JWT
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'freshservice-jwt-secret',
        });
        if (payload.role !== 'ADMIN') {
          socket.disconnect();
          return;
        }
        socket.data.type = 'operator';
        socket.data.userName = payload.firstName || 'Operador';
        this.operators.set(socket.id, socket);
        socket.join('operators');
        this.logger.log(`Operator connected: ${socket.data.userName}`);

        // Send active conversations list
        const conversations = await this.getActiveConversations();
        socket.emit('conversations', conversations);
      } catch {
        socket.disconnect();
      }
    } else if (sessionId) {
      // Client connecting from widget
      socket.data.type = 'client';
      socket.data.sessionId = sessionId;
      this.clients.set(sessionId, socket);
      socket.join(`session:${sessionId}`);
      this.logger.log(`Client connected: ${sessionId}`);

      // Check if operator is active on this conversation
      const conv = await this.prisma.chatConversation.findUnique({
        where: { sessionId },
      });
      if (conv?.operatorActive) {
        socket.emit('mode', { mode: 'operator', operatorName: conv.operatorName });
      } else {
        socket.emit('mode', { mode: 'ai' });
      }
      if (conv?.blocked) {
        socket.emit('moderation', {
          action: 'blocked',
          message: 'Esta conversación ha sido cerrada. Si necesitas ayuda, escríbenos por WhatsApp: +58 416-376-6075',
        });
      } else if (conv?.paused) {
        socket.emit('moderation', {
          action: 'paused',
          message: 'La conversación ha sido pausada. El operador te contactará pronto.',
        });
      }
    } else {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    if (socket.data.type === 'operator') {
      this.operators.delete(socket.id);
      this.logger.log(`Operator disconnected: ${socket.data.userName}`);
    } else if (socket.data.type === 'client') {
      this.clients.delete(socket.data.sessionId);
    }
  }

  // Operator takes control of a conversation
  @SubscribeMessage('takeOver')
  async handleTakeOver(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    if (socket.data.type !== 'operator') return;

    await this.prisma.chatConversation.update({
      where: { sessionId: data.sessionId },
      data: {
        operatorActive: true,
        operatorName: socket.data.userName,
        unreadByAdmin: 0,
      },
    });

    socket.join(`session:${data.sessionId}`);

    // Notify client that operator took over
    this.server.to(`session:${data.sessionId}`).emit('mode', {
      mode: 'operator',
      operatorName: socket.data.userName,
    });

    // Notify all operators
    this.server.to('operators').emit('conversationUpdated', {
      sessionId: data.sessionId,
      operatorActive: true,
      operatorName: socket.data.userName,
    });
  }

  // Operator releases control (back to AI)
  @SubscribeMessage('release')
  async handleRelease(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    if (socket.data.type !== 'operator') return;

    await this.prisma.chatConversation.update({
      where: { sessionId: data.sessionId },
      data: { operatorActive: false, operatorName: null },
    });

    socket.leave(`session:${data.sessionId}`);

    this.server.to(`session:${data.sessionId}`).emit('mode', { mode: 'ai' });
    this.server.to('operators').emit('conversationUpdated', {
      sessionId: data.sessionId,
      operatorActive: false,
    });
  }

  // Operator sends message to client
  @SubscribeMessage('operatorMessage')
  async handleOperatorMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { sessionId: string; message: string },
  ) {
    if (socket.data.type !== 'operator') return;
    if (!data.message?.trim()) return;

    const conv = await this.prisma.chatConversation.findUnique({
      where: { sessionId: data.sessionId },
    });
    if (!conv) return;

    const msg = await this.prisma.chatMessage.create({
      data: {
        conversationId: conv.id,
        role: 'operator',
        content: data.message.trim(),
      },
    });

    await this.prisma.chatConversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date(), messageCount: { increment: 1 } },
    });

    // Send to client widget
    this.server.to(`session:${data.sessionId}`).emit('message', {
      id: msg.id,
      role: 'operator',
      content: msg.content,
      createdAt: msg.createdAt,
      operatorName: socket.data.userName,
    });

    // Echo to all operators watching
    this.server.to('operators').emit('message', {
      sessionId: data.sessionId,
      id: msg.id,
      role: 'operator',
      content: msg.content,
      createdAt: msg.createdAt,
      operatorName: socket.data.userName,
    });
  }

  @SubscribeMessage('pauseConversation')
  async handlePause(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    if (socket.data.type !== 'operator') return;

    await this.prisma.chatConversation.update({
      where: { sessionId: data.sessionId },
      data: { paused: true },
    });

    this.server.to(`session:${data.sessionId}`).emit('moderation', {
      action: 'paused',
      message: 'La conversación ha sido pausada. El operador te contactará pronto.',
    });

    this.server.to('operators').emit('conversationUpdated', {
      sessionId: data.sessionId,
      paused: true,
    });
  }

  @SubscribeMessage('resumeConversation')
  async handleResume(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    if (socket.data.type !== 'operator') return;

    await this.prisma.chatConversation.update({
      where: { sessionId: data.sessionId },
      data: { paused: false },
    });

    this.server.to(`session:${data.sessionId}`).emit('moderation', {
      action: 'resumed',
      message: '',
    });

    this.server.to('operators').emit('conversationUpdated', {
      sessionId: data.sessionId,
      paused: false,
    });
  }

  @SubscribeMessage('blockConversation')
  async handleBlock(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    if (socket.data.type !== 'operator') return;

    await this.prisma.chatConversation.update({
      where: { sessionId: data.sessionId },
      data: { blocked: true, status: 'closed' },
    });

    this.server.to(`session:${data.sessionId}`).emit('moderation', {
      action: 'blocked',
      message: 'Esta conversación ha sido cerrada. Si necesitas ayuda, escríbenos por WhatsApp: +58 416-376-6075',
    });

    this.server.to('operators').emit('conversationUpdated', {
      sessionId: data.sessionId,
      blocked: true,
    });
  }

  // Called from ChatService when client sends a message via HTTP
  // This notifies operators in real-time
  async notifyNewClientMessage(sessionId: string, message: { id: string; role: string; content: string; createdAt: Date; type?: string; imageUrl?: string }) {
    // Increment unread counter
    await this.prisma.chatConversation.update({
      where: { sessionId },
      data: { unreadByAdmin: { increment: 1 } },
    });

    this.server.to('operators').emit('message', {
      sessionId,
      ...message,
    });

    // Also send updated conversation list
    const conversations = await this.getActiveConversations();
    this.server.to('operators').emit('conversations', conversations);
  }

  // Called from ChatService when AI responds
  async notifyAiResponse(sessionId: string, message: { id: string; role: string; content: string; createdAt: Date }) {
    this.server.to('operators').emit('message', {
      sessionId,
      ...message,
    });
  }

  private async getActiveConversations() {
    const convs = await this.prisma.chatConversation.findMany({
      where: { status: 'active', archived: false },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return convs.map(c => ({
      id: c.id,
      sessionId: c.sessionId,
      operatorActive: c.operatorActive,
      operatorName: c.operatorName,
      unreadByAdmin: c.unreadByAdmin,
      messageCount: c.messageCount,
      lastMessageAt: c.lastMessageAt,
      startedAt: c.startedAt,
      lastMessage: c.messages[0] || null,
      paused: c.paused,
      blocked: c.blocked,
      archived: c.archived,
    }));
  }
}
