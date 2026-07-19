import { Controller, Post, Get, Patch, Delete, Param, Query, Body, HttpCode, HttpStatus, UseGuards, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Solo un ADMIN logueado puede ver el directorio de clientes del taller
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.usersService.findAllClients();
  }

  // Solo un ADMIN logueado puede ver el listado de técnicos del taller
  @Get('technicians')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findTechnicians() {
    return this.usersService.findAllTechnicians();
  }

  @Post('register')
  async register(@Body() registerDto: RegisterUserDto) {
    return this.usersService.register(registerDto);
  }

  @Get('verify-link')
  async verifyLink(@Query('token') token: string, @Res() res: any) {
    try {
      await this.usersService.verifyEmailLink(token);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
      return res.redirect(`${frontendUrl}/login?verified=true`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
      const errMsg = encodeURIComponent(error.message || 'Error de verificación');
      return res.redirect(`${frontendUrl}/login?error=${errMsg}`);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserDto) {
    return this.usersService.login(loginDto);
  }

  // Solicitar restablecimiento de contraseña (público)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.usersService.requestPasswordReset(dto.email);
  }

  // Restablecer la contraseña con el token del correo (público)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(dto.token, dto.password);
  }

  // Editar un usuario (solo ADMIN del taller)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  // Eliminar un usuario (solo ADMIN del taller)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
