import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { UsersModule } from './users/users.module';
import { RateModule } from './rate/rate.module';

@Module({
  imports: [
    // JWT global: cualquier servicio/guard puede inyectar JwtService
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES || '7d') as any },
    }),
    PrismaModule,
    AppointmentsModule,
    UsersModule,
    RateModule,
  ],
})
export class AppModule {}
