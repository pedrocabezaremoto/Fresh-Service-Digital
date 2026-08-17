import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  /** Catálogo público: solo servicios activos, ordenados para el formulario. */
  findActive() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /** Panel admin: todos los servicios + conteo de citas asociadas. */
  findAll() {
    return this.prisma.service.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { appointments: true } } },
    });
  }

  async create(dto: CreateServiceDto) {
    try {
      return await this.prisma.service.create({
        data: {
          name: dto.name.trim(),
          category: dto.category,
          equipmentType: dto.equipmentType,
          priceUsd: dto.priceUsd,
          description: dto.description?.trim() || null,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch (e: unknown) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  async update(id: string, dto: UpdateServiceDto) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Servicio no encontrado');

    const data: Prisma.ServiceUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.equipmentType !== undefined) data.equipmentType = dto.equipmentType;
    if (dto.priceUsd !== undefined) data.priceUsd = dto.priceUsd;
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    try {
      return await this.prisma.service.update({ where: { id }, data });
    } catch (e: unknown) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      include: { _count: { select: { appointments: true } } },
    });
    if (!existing) throw new NotFoundException('Servicio no encontrado');

    const count = existing._count.appointments;
    if (count > 0) {
      throw new ConflictException(
        `Este servicio tiene ${count} citas asociadas. Desactívalo en lugar de borrarlo.`,
      );
    }

    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
  }

  private rethrowUnique(e: unknown): void {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new ConflictException(
        'Ya existe un servicio con ese nombre para este tipo de equipo',
      );
    }
  }
}
