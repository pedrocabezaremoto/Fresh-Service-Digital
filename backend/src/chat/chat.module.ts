import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LlmService } from './llm.service';
import { ChatTelegramService } from './chat-telegram.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'freshservice-jwt-secret',
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, LlmService, ChatTelegramService, ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
