import { Controller, Patch, Param, Body } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Patch(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body('parts') parts: { partId: string; quantity: number }[]
  ) {
    return this.appointmentsService.completeAppointment(id, parts || []);
  }
}
