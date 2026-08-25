import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { detectImageMime } from '../site-images/image-meta';
import {
  ALLOWED_IMAGE_MIMES,
  extForMime,
  MAX_IMAGE_BYTES,
} from '../site-images/site-image.slots';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

const EQUIPMENT_IMAGE_DIR = join(process.cwd(), 'uploads', 'equipment-types');

function equipmentImageUrl(filename?: string | null) {
  return filename ? `/uploads/equipment-types/${filename}` : null;
}

function withImageUrl<T extends { imageFilename?: string | null }>(row: T) {
  return { ...row, imageUrl: equipmentImageUrl(row.imageFilename) };
}

function unlinkEquipmentImage(filename?: string | null) {
  if (!filename) return;
  const filePath = join(EQUIPMENT_IMAGE_DIR, filename);
  if (existsSync(filePath)) unlinkSync(filePath);
}

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  findActive() {
    return this.servicesService.findActive();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.servicesService.findAll();
  }

  @Get('categories')
  async getCategories() {
    return this.prisma.serviceCategoryOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  @Get('categories/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllCategories() {
    return this.prisma.serviceCategoryOption.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createCategory(@Body() body: { slug: string; label: string; sortOrder?: number }) {
    return this.prisma.serviceCategoryOption.create({
      data: {
        slug: body.slug.toUpperCase().replace(/\s+/g, '_'),
        label: body.label,
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { label?: string; sortOrder?: number; isActive?: boolean },
  ) {
    return this.prisma.serviceCategoryOption.update({
      where: { id },
      data: body,
    });
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteCategory(@Param('id') id: string) {
    const option = await this.prisma.serviceCategoryOption.findUnique({ where: { id } });
    if (!option) throw new BadRequestException('Categoría no encontrada');
    const inUse = await this.prisma.service.count({ where: { category: option.slug } });
    if (inUse > 0) {
      throw new BadRequestException('Esta categoría tiene servicios asignados. Elimínalos primero.');
    }
    return this.prisma.serviceCategoryOption.delete({ where: { id } });
  }

  @Get('equipment-types')
  async getEquipmentTypes() {
    const types = await this.prisma.equipmentTypeOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      select: { equipmentType: true, priceUsd: true },
    });
    return types.map((t) => {
      const matching = services.filter((s) => s.equipmentType === t.slug);
      const prices = matching
        .map((s) => Number(s.priceUsd))
        .filter((p) => Number.isFinite(p) && p > 0);
      return {
        ...t,
        serviceCount: matching.length,
        minPriceUsd: prices.length ? Math.min(...prices) : null,
        imageUrl: equipmentImageUrl(t.imageFilename),
      };
    });
  }

  @Get('equipment-types/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllEquipmentTypes() {
    const types = await this.prisma.equipmentTypeOption.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return types.map(withImageUrl);
  }

  @Post('equipment-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createEquipmentType(@Body() body: { slug: string; label: string; description?: string; sortOrder?: number }) {
    return withImageUrl(
      await this.prisma.equipmentTypeOption.create({
        data: {
          slug: body.slug.toUpperCase().replace(/\s+/g, '_'),
          label: body.label,
          description: body.description?.trim() || null,
          sortOrder: body.sortOrder ?? 0,
        },
      }),
    );
  }

  @Patch('equipment-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateEquipmentType(
    @Param('id') id: string,
    @Body() body: { label?: string; description?: string; sortOrder?: number; isActive?: boolean },
  ) {
    const data = { ...body };
    if (typeof data.description === 'string') {
      data.description = data.description.trim() || null;
    }
    return withImageUrl(
      await this.prisma.equipmentTypeOption.update({
        where: { id },
        data,
      }),
    );
  }

  @Delete('equipment-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteEquipmentType(@Param('id') id: string) {
    const option = await this.prisma.equipmentTypeOption.findUnique({ where: { id } });
    if (!option) throw new BadRequestException('Tipo de equipo no encontrado');
    const inUse = await this.prisma.service.count({ where: { equipmentType: option.slug } });
    if (inUse > 0) {
      throw new BadRequestException('Este tipo de equipo tiene servicios asignados. Elimínalos primero.');
    }
    unlinkEquipmentImage(option.imageFilename);
    return this.prisma.equipmentTypeOption.delete({ where: { id } });
  }

  @Post('equipment-types/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  async uploadEquipmentTypeImage(
    @Param('id') id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debes adjuntar una imagen (JPG, PNG o WebP)');
    }
    const mime = detectImageMime(file.buffer);
    if (!mime || !(ALLOWED_IMAGE_MIMES as readonly string[]).includes(mime)) {
      throw new BadRequestException('Formato no soportado. Usa JPG, PNG o WebP.');
    }
    const existing = await this.prisma.equipmentTypeOption.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Tipo de equipo no encontrado');

    mkdirSync(EQUIPMENT_IMAGE_DIR, { recursive: true });
    const filename = `${id}-${Date.now()}${extForMime(mime)}`;
    writeFileSync(join(EQUIPMENT_IMAGE_DIR, filename), file.buffer);
    unlinkEquipmentImage(existing.imageFilename);

    return withImageUrl(
      await this.prisma.equipmentTypeOption.update({
        where: { id },
        data: { imageFilename: filename },
      }),
    );
  }

  @Delete('equipment-types/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteEquipmentTypeImage(@Param('id') id: string) {
    const existing = await this.prisma.equipmentTypeOption.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Tipo de equipo no encontrado');
    unlinkEquipmentImage(existing.imageFilename);
    return withImageUrl(
      await this.prisma.equipmentTypeOption.update({
        where: { id },
        data: { imageFilename: null },
      }),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
