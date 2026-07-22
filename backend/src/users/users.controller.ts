import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createUser(@Body() body: any) {
    return this.usersService.create(body.username, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getInfo() {
    return { success: true };
  }
}
