import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MAX_IMAGE_BYTES } from '../site-images/site-image.slots';
import { CarouselService } from './carousel.service';
import { UploadExceptionFilter } from '../site-images/upload-exception.filter';

@Controller('carousel')
export class CarouselController {
  constructor(private readonly carousel: CarouselService) {}

  // Público: el frontend lo usa para mostrar el carrusel
  @Get()
  findActive() {
    return this.carousel.findActive();
  }

  // Admin: ver todas (activas e inactivas)
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.carousel.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseFilters(UploadExceptionFilter)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  upload(@UploadedFile() file: any) {
    return this.carousel.create(file);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  reorder(@Body() body: { ids: string[] }) {
    return this.carousel.reorder(body.ids);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  toggleActive(@Param('id') id: string) {
    return this.carousel.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.carousel.remove(id);
  }
}
