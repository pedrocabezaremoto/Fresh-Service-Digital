import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterUserDto) {
    return this.usersService.register(registerDto);
  }

  @Post('verify')
  async verify(@Body() verifyDto: VerifyUserDto) {
    return this.usersService.verifyEmail(verifyDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserDto) {
    return this.usersService.login(loginDto);
  }
}
