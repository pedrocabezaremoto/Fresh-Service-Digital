import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async create(@Body() createDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createDto);
  }

  @Get()
  async getAll() {
    return this.appointmentsService.findAll();
  }

  @Get('client/:clientId')
  async getByClient(@Param('clientId') clientId: string) {
    return this.appointmentsService.findByClient(clientId);
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string) {
    return this.appointmentsService.completeAppointment(id);
  }
}
