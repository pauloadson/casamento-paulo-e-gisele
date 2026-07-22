import { Body, Controller, Get, Post } from '@nestjs/common';
import { GuestService } from './guest.service';

@Controller('guests')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Post()
  async create(@Body() body: any) {
    return this.guestService.create(body);
  }

  @Get()
  async findAll() {
    return this.guestService.findAll();
  }
}
