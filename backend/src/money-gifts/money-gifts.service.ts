import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateMoneyGiftDto {
  guestName?: string;
  amount: number;
  type: 'pix' | 'cash' | 'both';
  pixAmount?: number;
  cashAmount?: number;
  message?: string;
}

export interface MoneyGiftSummary {
  totalPix: number;
  totalCash: number;
  totalBoth: number;
  totalCombined: number;
  totalCancelled: number;
  count: number;
  cancelledCount: number;
}

@Injectable()
export class MoneyGiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMoneyGiftDto) {
    if (data.type === 'pix' || data.type === 'both') {
      const pixKeySetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'pixKey' },
      });
      if (!pixKeySetting || !pixKeySetting.value?.trim()) {
        throw new BadRequestException(
          'A chave PIX ainda não foi configurada pelos noivos no sistema.',
        );
      }
    }

    return this.prisma.moneyGift.create({
      data: {
        guestName: data.guestName?.trim() || 'Anônimo',
        amount: data.amount,
        type: data.type,
        pixAmount: data.type === 'pix' ? data.amount : (data.pixAmount ?? null),
        cashAmount: data.type === 'cash' ? data.amount : (data.cashAmount ?? null),
        status: 'CONFIRMED',
        message: data.message ?? null,
      },
    });
  }

  async findAll() {
    return this.prisma.moneyGift.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(): Promise<MoneyGiftSummary> {
    const all = await this.prisma.moneyGift.findMany();

    let totalPix = 0;
    let totalCash = 0;
    let totalBoth = 0;
    let totalCancelled = 0;
    let cancelledCount = 0;
    let activeCount = 0;

    for (const gift of all) {
      if (gift.status === 'CANCELLED') {
        totalCancelled += gift.amount;
        cancelledCount++;
        continue;
      }

      activeCount++;
      if (gift.type === 'pix') {
        totalPix += gift.amount;
      } else if (gift.type === 'cash') {
        totalCash += gift.amount;
      } else if (gift.type === 'both') {
        totalBoth += gift.amount;
      }
    }

    return {
      totalPix,
      totalCash,
      totalBoth,
      totalCombined: totalPix + totalCash + totalBoth,
      totalCancelled,
      count: activeCount,
      cancelledCount,
    };
  }

  async cancel(id: number) {
    const existing = await this.prisma.moneyGift.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Presente em dinheiro #${id} não encontrado.`);
    }
    return this.prisma.moneyGift.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async updateStatus(id: number, status: string) {
    const existing = await this.prisma.moneyGift.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Presente em dinheiro #${id} não encontrado.`);
    }
    const validStatus = status.toUpperCase() === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED';
    return this.prisma.moneyGift.update({
      where: { id },
      data: { status: validStatus },
    });
  }

  async delete(id: number) {
    const existing = await this.prisma.moneyGift.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Presente em dinheiro #${id} não encontrado.`);
    }
    return this.prisma.moneyGift.delete({ where: { id } });
  }
}
