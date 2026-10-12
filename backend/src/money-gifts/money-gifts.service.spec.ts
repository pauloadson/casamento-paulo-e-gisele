import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MoneyGiftsService, CreateMoneyGiftDto } from './money-gifts.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  systemSetting: {
    findUnique: jest.fn(),
  },
  moneyGift: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('MoneyGiftsService', () => {
  let service: MoneyGiftsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoneyGiftsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MoneyGiftsService>(MoneyGiftsService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('deve criar um presente do tipo "cash" sem verificar a chave PIX', async () => {
      const dto: CreateMoneyGiftDto = { guestName: 'João', amount: 100, type: 'cash' };
      mockPrisma.moneyGift.create.mockResolvedValue({ id: 1, ...dto, status: 'CONFIRMED' });

      const result = await service.create(dto);

      expect(mockPrisma.systemSetting.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.moneyGift.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'cash', amount: 100, status: 'CONFIRMED' }),
      });
      expect(result).toHaveProperty('id', 1);
    });

    it('deve lançar BadRequestException para "pix" quando a chave PIX não está configurada', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue(null);
      const dto: CreateMoneyGiftDto = { guestName: 'Maria', amount: 50, type: 'pix' };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.moneyGift.create).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException para "pix" quando a chave PIX está em branco', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue({ key: 'pixKey', value: '   ' });
      const dto: CreateMoneyGiftDto = { guestName: 'Maria', amount: 50, type: 'pix' };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('deve criar um presente "pix" quando a chave PIX está configurada', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue({ key: 'pixKey', value: 'minha@chave.pix' });
      mockPrisma.moneyGift.create.mockResolvedValue({ id: 2, status: 'CONFIRMED' });
      const dto: CreateMoneyGiftDto = { guestName: 'Pedro', amount: 200, type: 'pix' };

      const result = await service.create(dto);

      expect(result).toHaveProperty('id', 2);
    });

    it('deve usar "Anônimo" como nome quando guestName não for fornecido', async () => {
      mockPrisma.moneyGift.create.mockResolvedValue({ id: 3, guestName: 'Anônimo', status: 'CONFIRMED' });
      const dto: CreateMoneyGiftDto = { amount: 30, type: 'cash' };

      await service.create(dto);

      expect(mockPrisma.moneyGift.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ guestName: 'Anônimo' }),
      });
    });
  });

  // ─── getSummary ───────────────────────────────────────────────────────────────

  describe('getSummary()', () => {
    it('deve calcular corretamente os totais excluindo registros CANCELLED', async () => {
      mockPrisma.moneyGift.findMany.mockResolvedValue([
        { id: 1, type: 'pix',  amount: 100, status: 'CONFIRMED' },
        { id: 2, type: 'cash', amount: 50,  status: 'CONFIRMED' },
        { id: 3, type: 'both', amount: 80,  status: 'CONFIRMED' },
        { id: 4, type: 'pix',  amount: 200, status: 'CANCELLED' },
      ]);

      const summary = await service.getSummary();

      expect(summary.totalPix).toBe(100);
      expect(summary.totalCash).toBe(50);
      expect(summary.totalBoth).toBe(80);
      expect(summary.totalCombined).toBe(230);
      expect(summary.totalCancelled).toBe(200);
      expect(summary.count).toBe(3);
      expect(summary.cancelledCount).toBe(1);
    });

    it('deve retornar zeros quando não há presentes', async () => {
      mockPrisma.moneyGift.findMany.mockResolvedValue([]);

      const summary = await service.getSummary();

      expect(summary.totalCombined).toBe(0);
      expect(summary.count).toBe(0);
      expect(summary.cancelledCount).toBe(0);
    });
  });

  // ─── cancel ───────────────────────────────────────────────────────────────────

  describe('cancel()', () => {
    it('deve marcar o presente como CANCELLED', async () => {
      mockPrisma.moneyGift.findUnique.mockResolvedValue({ id: 1, status: 'CONFIRMED' });
      mockPrisma.moneyGift.update.mockResolvedValue({ id: 1, status: 'CANCELLED' });

      const result = await service.cancel(1);

      expect(mockPrisma.moneyGift.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'CANCELLED' },
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('deve lançar NotFoundException quando o presente não existe', async () => {
      mockPrisma.moneyGift.findUnique.mockResolvedValue(null);

      await expect(service.cancel(999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.moneyGift.update).not.toHaveBeenCalled();
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────────

  describe('updateStatus()', () => {
    it('deve atualizar o status para CANCELLED', async () => {
      mockPrisma.moneyGift.findUnique.mockResolvedValue({ id: 1, status: 'CONFIRMED' });
      mockPrisma.moneyGift.update.mockResolvedValue({ id: 1, status: 'CANCELLED' });

      const result = await service.updateStatus(1, 'cancelled');

      expect(mockPrisma.moneyGift.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'CANCELLED' },
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('deve restaurar o status para CONFIRMED quando o valor for diferente de CANCELLED', async () => {
      mockPrisma.moneyGift.findUnique.mockResolvedValue({ id: 1, status: 'CANCELLED' });
      mockPrisma.moneyGift.update.mockResolvedValue({ id: 1, status: 'CONFIRMED' });

      const result = await service.updateStatus(1, 'confirmed');

      expect(mockPrisma.moneyGift.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'CONFIRMED' },
      });
      expect(result.status).toBe('CONFIRMED');
    });

    it('deve lançar NotFoundException quando o presente não existe', async () => {
      mockPrisma.moneyGift.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'CANCELLED')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('deve deletar o presente quando ele existe', async () => {
      mockPrisma.moneyGift.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.moneyGift.delete.mockResolvedValue({ id: 1 });

      const result = await service.delete(1);

      expect(mockPrisma.moneyGift.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toHaveProperty('id', 1);
    });

    it('deve lançar NotFoundException quando o presente não existe', async () => {
      mockPrisma.moneyGift.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.moneyGift.delete).not.toHaveBeenCalled();
    });
  });
});
