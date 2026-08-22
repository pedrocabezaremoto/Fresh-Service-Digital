import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { detectImageMime, readImageSize } from '../site-images/image-meta';
import {
  ALLOWED_IMAGE_MIMES,
  extForMime,
  MAX_IMAGE_BYTES,
} from '../site-images/site-image.slots';

export type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class CarouselService implements OnModuleInit {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'carousel');

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    mkdirSync(this.uploadDir, { recursive: true });
  }

  private publicBase() {
    return process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`;
  }

  private toDto(row: {
    id: string;
    filename: string;
    alt: string;
    position: number;
    active: boolean;
    width: number | null;
    height: number | null;
    sizeBytes: number | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      url: `${this.publicBase()}/uploads/carousel/${row.filename}`,
      filename: row.filename,
      alt: row.alt,
      position: row.position,
      active: row.active,
      width: row.width,
      height: row.height,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt,
    };
  }

  async findAll() {
    const rows = await this.prisma.carouselImage.findMany({ orderBy: { position: 'asc' } });
    return rows.map((r) => this.toDto(r));
  }

  async findActive() {
    const rows = await this.prisma.carouselImage.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async create(file?: UploadedFile) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debes adjuntar un archivo en el campo file');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('La imagen no puede superar 2 MB');
    }

    const mime = detectImageMime(file.buffer);
    if (!mime || !(ALLOWED_IMAGE_MIMES as readonly string[]).includes(mime)) {
      throw new BadRequestException('Formato no soportado. Usa JPG, PNG o WebP.');
    }
    if (file.mimetype && !(ALLOWED_IMAGE_MIMES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException('Formato no soportado. Usa JPG, PNG o WebP.');
    }

    const { width, height } = readImageSize(file.buffer);
    const filename = `carousel-${Date.now()}${extForMime(mime)}`;
    mkdirSync(this.uploadDir, { recursive: true });
    writeFileSync(join(this.uploadDir, filename), file.buffer);

    const agg = await this.prisma.carouselImage.aggregate({ _max: { position: true } });
    const position = (agg._max.position ?? -1) + 1;

    const row = await this.prisma.carouselImage.create({
      data: {
        filename,
        mimeType: mime,
        alt: '',
        position,
        active: true,
        width,
        height,
        sizeBytes: file.size,
      },
    });

    return this.toDto(row);
  }

  async remove(id: string) {
    const existing = await this.prisma.carouselImage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Imagen del carrusel no encontrada');
    }
    this.removeFile(existing.filename);
    await this.prisma.carouselImage.delete({ where: { id } });
    return { deleted: true, id };
  }

  async reorder(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Debes enviar un array de ids');
    }
    await this.prisma.$transaction(
      ids.map((id, i) =>
        this.prisma.carouselImage.update({ where: { id }, data: { position: i } }),
      ),
    );
    return this.findAll();
  }

  async toggleActive(id: string) {
    const existing = await this.prisma.carouselImage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Imagen del carrusel no encontrada');
    }
    const row = await this.prisma.carouselImage.update({
      where: { id },
      data: { active: !existing.active },
    });
    return this.toDto(row);
  }

  private removeFile(filename: string) {
    const path = join(this.uploadDir, filename);
    if (existsSync(path)) {
      try {
        unlinkSync(path);
      } catch {
        /* el registro se borra igual */
      }
    }
  }
}
