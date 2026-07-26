import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('system-logs')
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.systemLogsService.findAll();
  }
}
