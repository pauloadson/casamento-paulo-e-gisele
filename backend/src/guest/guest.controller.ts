import { Body, Controller, Delete, Get, Param, Post, UseGuards, Query } from '@nestjs/common';
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
  async findAll(@Query('search') search?: string) {
    return this.guestService.findAll(search);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.guestService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/dependents/:dependentId')
  async linkDependent(@Param('id') id: string, @Param('dependentId') dependentId: string) {
    return this.guestService.linkDependent(+id, +dependentId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/dependents/:dependentId')
  async unlinkDependent(@Param('id') id: string, @Param('dependentId') dependentId: string) {
    return this.guestService.unlinkDependent(+id, +dependentId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.guestService.remove(+id);
  }
}
