import { Controller, Post, Get, Query, Body, HttpCode, HttpStatus, Header, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
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

  @Post('register')
  async register(@Body() registerDto: RegisterUserDto) {
    return this.usersService.register(registerDto);
  }

  @Get('verify-link')
  @Header('Content-Type', 'text/html')
  async verifyLink(@Query('token') token: string) {
    return this.usersService.verifyEmailLink(token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserDto) {
    return this.usersService.login(loginDto);
  }
}
