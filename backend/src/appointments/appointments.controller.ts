import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Crear cita: cualquier usuario autenticado (cliente logueado)
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createDto);
  }

  // Ver TODAS las citas: solo ADMIN (panel del taller)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAll() {
    return this.appointmentsService.findAll();
  }

  // Historial de un cliente: requiere estar autenticado
  @Get('client/:clientId')
  @UseGuards(JwtAuthGuard)
  async getByClient(@Param('clientId') clientId: string) {
    return this.appointmentsService.findByClient(clientId);
  }

  // Cambiar estado de una cita: solo ADMIN
  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async complete(@Param('id') id: string) {
    return this.appointmentsService.completeAppointment(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, updateStatusDto.status);
  }
}
