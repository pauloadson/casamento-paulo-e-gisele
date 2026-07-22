import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GuestService } from './guest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('guests')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Post()
  async create(@Body() body: any) {
    return this.guestService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.guestService.findAll();
  }
}
