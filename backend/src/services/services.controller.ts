import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

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
    return this.prisma.equipmentTypeOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  @Get('equipment-types/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllEquipmentTypes() {
    return this.prisma.equipmentTypeOption.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  @Post('equipment-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createEquipmentType(@Body() body: { slug: string; label: string; sortOrder?: number }) {
    return this.prisma.equipmentTypeOption.create({
      data: {
        slug: body.slug.toUpperCase().replace(/\s+/g, '_'),
        label: body.label,
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  @Patch('equipment-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateEquipmentType(
    @Param('id') id: string,
    @Body() body: { label?: string; sortOrder?: number; isActive?: boolean },
  ) {
    return this.prisma.equipmentTypeOption.update({
      where: { id },
      data: body,
    });
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
    return this.prisma.equipmentTypeOption.delete({ where: { id } });
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
