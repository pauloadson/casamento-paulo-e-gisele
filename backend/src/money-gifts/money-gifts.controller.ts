import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MoneyGiftsService, CreateMoneyGiftDto } from './money-gifts.service';
import { ApiKeyGuard } from '../api-key.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(ApiKeyGuard)
@Controller('money-gifts')
export class MoneyGiftsController {
  constructor(private readonly moneyGiftsService: MoneyGiftsService) {}

  /** Public – any client with a valid API key can submit a gift record */
  @Post()
  async create(@Body() body: CreateMoneyGiftDto) {
    return this.moneyGiftsService.create(body);
  }

  /** Public / Guest or Admin – cancel a gift record */
  @Patch(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.moneyGiftsService.cancel(+id);
  }

  /** Protected – admin only: toggle or set status */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.moneyGiftsService.updateStatus(+id, status);
  }

  /** Protected – admin only: full list */
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.moneyGiftsService.findAll();
  }

  /** Public – returns totals only, safe to show */
  @Get('summary')
  async getSummary() {
    return this.moneyGiftsService.getSummary();
  }

  /** Protected – admin only: remove a record */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.moneyGiftsService.delete(+id);
  }
}
