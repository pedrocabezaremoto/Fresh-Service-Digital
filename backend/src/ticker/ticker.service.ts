import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TickerService {
  constructor(private prisma: PrismaService) {}

  findActive() {
    return this.prisma.tickerMessage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, text: true, sortOrder: true },
    });
  }

  findAll() {
    return this.prisma.tickerMessage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  create(text: string) {
    return this.prisma.tickerMessage.create({ data: { text } });
  }

  async update(id: string, data: { text?: string; isActive?: boolean; sortOrder?: number }) {
    return this.prisma.tickerMessage.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.tickerMessage.delete({ where: { id } });
  }
}
