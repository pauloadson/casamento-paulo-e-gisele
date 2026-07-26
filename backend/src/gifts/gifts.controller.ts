import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gifts')
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  @Get()
  async findAll() {
    return this.giftsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('categories')
  async createCategory(@Body() body: { name: string; icon?: string }) {
    return this.giftsService.createCategory(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('categories/reorder')
  async reorderCategories(@Body() body: { order: { id: number; sequence: number }[] }) {
    return this.giftsService.reorderCategories(body.order);
  }

  @UseGuards(JwtAuthGuard)
  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; icon?: string; sequence?: number },
  ) {
    return this.giftsService.updateCategory(+id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.giftsService.deleteCategory(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  async createItem(@Body() body: { categoryId: number; name: string }) {
    return this.giftsService.createItem(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('items/:id')
  async updateItem(
    @Param('id') id: string,
    @Body() body: { name?: string; isReceived?: boolean; givenBy?: string | null },
  ) {
    return this.giftsService.updateItem(+id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:id')
  async deleteItem(@Param('id') id: string) {
    return this.giftsService.deleteItem(+id);
  }
}
