import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
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

  // ADMIN: todas. TECHNICIAN: solo las asignadas por el taller.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TECHNICIAN')
  async getAll(@Req() req: any) {
    return this.appointmentsService.findAll(req.user);
  }

  // Historial de un cliente: requiere estar autenticado
  @Get('client/:clientId')
  @UseGuards(JwtAuthGuard)
  async getByClient(@Param('clientId') clientId: string) {
    return this.appointmentsService.findByClient(clientId);
  }

  // Cambiar estado: ADMIN libre; TECHNICIAN solo sobre citas suyas
  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TECHNICIAN')
  async complete(@Param('id') id: string, @Req() req: any) {
    return this.appointmentsService.completeAppointment(id, req.user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TECHNICIAN')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Req() req: any,
  ) {
    return this.appointmentsService.updateStatus(id, updateStatusDto.status, req.user);
  }

  // Asignar técnico: SOLO el taller (ADMIN). El técnico no se auto-asigna.
  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async assign(
    @Param('id') id: string,
    @Body('technicianId') technicianId: string | null,
  ) {
    return this.appointmentsService.assignTechnician(id, technicianId);
  }

  // Actualizar ubicación (u otros campos parciales) de una cita
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateDto);
  }
}
