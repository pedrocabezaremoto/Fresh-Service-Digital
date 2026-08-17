import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { detectImageMime, readImageSize } from './image-meta';
import {
  ALLOWED_IMAGE_MIMES,
  extForMime,
  isSiteImageSlot,
  MAX_IMAGE_BYTES,
} from './site-image.slots';

export type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class SiteImagesService implements OnModuleInit {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'site');

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    mkdirSync(this.uploadDir, { recursive: true });
  }

  private publicBase() {
    return process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`;
  }

  private toDto(row: { slot: string; filename: string; mimeType: string; width: number | null; height: number | null; sizeBytes: number | null; updatedAt: Date }) {
    return {
      slot: row.slot,
      url: `${this.publicBase()}/uploads/site/${row.filename}`,
      filename: row.filename,
      mimeType: row.mimeType,
      width: row.width,
      height: row.height,
      sizeBytes: row.sizeBytes,
      updatedAt: row.updatedAt,
    };
  }

  async findAll() {
    const rows = await this.prisma.siteImage.findMany({ orderBy: { slot: 'asc' } });
    return rows.map((r) => this.toDto(r));
  }

  async upsert(slot: string, file?: UploadedFile) {
    if (!isSiteImageSlot(slot)) {
      throw new BadRequestException('Slot de imagen no válido');
    }
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
    const filename = `${slot}-${Date.now()}${extForMime(mime)}`;
    const dest = join(this.uploadDir, filename);

    mkdirSync(this.uploadDir, { recursive: true });
    writeFileSync(dest, file.buffer);

    const existing = await this.prisma.siteImage.findUnique({ where: { slot } });
    if (existing) {
      this.removeFile(existing.filename);
    }

    const row = await this.prisma.siteImage.upsert({
      where: { slot },
      create: {
        slot,
        filename,
        mimeType: mime,
        width,
        height,
        sizeBytes: file.size,
      },
      update: {
        filename,
        mimeType: mime,
        width,
        height,
        sizeBytes: file.size,
      },
    });

    return this.toDto(row);
  }

  async remove(slot: string) {
    if (!isSiteImageSlot(slot)) {
      throw new BadRequestException('Slot de imagen no válido');
    }
    const existing = await this.prisma.siteImage.findUnique({ where: { slot } });
    if (!existing) {
      throw new NotFoundException('Este slot no tiene una imagen personalizada');
    }
    this.removeFile(existing.filename);
    await this.prisma.siteImage.delete({ where: { slot } });
    return { deleted: true, slot };
  }

  private removeFile(filename: string) {
    const path = join(this.uploadDir, filename);
    if (existsSync(path)) {
      try {
        unlinkSync(path);
      } catch {
        /* el registro se borra igual; un archivo huérfano no rompe el sitio */
      }
    }
  }
}
