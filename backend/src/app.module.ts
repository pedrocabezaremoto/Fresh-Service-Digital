import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AppointmentsModule, UsersModule],
})
export class AppModule {}
