import { Controller, Post, Get, Query, Body, HttpCode, HttpStatus, Header } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
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
