import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LlmService } from './llm.service';
import { ChatTelegramService } from './chat-telegram.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, LlmService, ChatTelegramService],
})
export class ChatModule {}
