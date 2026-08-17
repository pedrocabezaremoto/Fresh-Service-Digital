import {
  Controller,
  Delete,
  Get,
  Param,
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
import { MAX_IMAGE_BYTES } from './site-image.slots';
import { SiteImagesService } from './site-images.service';
import { UploadExceptionFilter } from './upload-exception.filter';

@Controller('site-images')
export class SiteImagesController {
  constructor(private readonly siteImages: SiteImagesService) {}

  @Get()
  findAll() {
    return this.siteImages.findAll();
  }

  @Post(':slot')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseFilters(UploadExceptionFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  upload(
    @Param('slot') slot: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ) {
    return this.siteImages.upsert(slot, file);
  }

  @Delete(':slot')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('slot') slot: string) {
    return this.siteImages.remove(slot);
  }
}
