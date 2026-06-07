import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar validación global de datos (DTOs)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Habilitar CORS para poder comunicarnos con el Front-end
  app.enableCors();

  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}
bootstrap();
