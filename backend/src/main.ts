import 'dotenv/config'; // Carga las variables del .env en process.env ANTES de todo
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadsDir = join(process.cwd(), 'uploads');
  mkdirSync(join(uploadsDir, 'site'), { recursive: true });
  mkdirSync(join(uploadsDir, 'carousel'), { recursive: true });
  mkdirSync(join(uploadsDir, 'chat-images'), { recursive: true });
  mkdirSync(join(uploadsDir, 'equipment-types'), { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  // Habilitar validación global de datos (DTOs)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // CORS: el frontend (otro origen) puede llamar la API y cargar /uploads/
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
