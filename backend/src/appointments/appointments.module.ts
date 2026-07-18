import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { MailModule } from '../mail/mail.module';
import { RateModule } from '../rate/rate.module';

@Module({
  imports: [MailModule, RateModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
