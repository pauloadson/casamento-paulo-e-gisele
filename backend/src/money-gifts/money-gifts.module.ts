import { Module } from '@nestjs/common';
import { MoneyGiftsController } from './money-gifts.controller';
import { MoneyGiftsService } from './money-gifts.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MoneyGiftsController],
  providers: [MoneyGiftsService],
  exports: [MoneyGiftsService],
})
export class MoneyGiftsModule {}
