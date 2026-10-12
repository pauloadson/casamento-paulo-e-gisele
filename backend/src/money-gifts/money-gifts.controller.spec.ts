import { Test, TestingModule } from '@nestjs/testing';
import { MoneyGiftsController } from './money-gifts.controller';
import { MoneyGiftsService } from './money-gifts.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  getSummary: jest.fn(),
  cancel: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
};

describe('MoneyGiftsController', () => {
  let controller: MoneyGiftsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoneyGiftsController],
      providers: [{ provide: MoneyGiftsService, useValue: mockService }],
    }).compile();

    controller = module.get<MoneyGiftsController>(MoneyGiftsController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('deve chamar service.create com o body recebido', async () => {
      const dto = { guestName: 'Ana', amount: 150, type: 'cash' as const };
      mockService.create.mockResolvedValue({ id: 1, ...dto });

      const result = await controller.create(dto);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('cancel()', () => {
    it('deve chamar service.cancel com o id numérico', async () => {
      mockService.cancel.mockResolvedValue({ id: 5, status: 'CANCELLED' });

      const result = await controller.cancel('5');

      expect(mockService.cancel).toHaveBeenCalledWith(5);
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('updateStatus()', () => {
    it('deve chamar service.updateStatus com id numérico e status', async () => {
      mockService.updateStatus.mockResolvedValue({ id: 3, status: 'CONFIRMED' });

      const result = await controller.updateStatus('3', 'CONFIRMED');

      expect(mockService.updateStatus).toHaveBeenCalledWith(3, 'CONFIRMED');
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('findAll()', () => {
    it('deve retornar a lista de presentes', async () => {
      const gifts = [{ id: 1 }, { id: 2 }];
      mockService.findAll.mockResolvedValue(gifts);

      const result = await controller.findAll();

      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getSummary()', () => {
    it('deve retornar o resumo dos totais', async () => {
      const summary = { totalPix: 100, totalCash: 50, totalCombined: 150, count: 2, cancelledCount: 0 };
      mockService.getSummary.mockResolvedValue(summary);

      const result = await controller.getSummary();

      expect(mockService.getSummary).toHaveBeenCalled();
      expect(result).toEqual(summary);
    });
  });

  describe('delete()', () => {
    it('deve chamar service.delete com o id numérico', async () => {
      mockService.delete.mockResolvedValue({ id: 7 });

      const result = await controller.delete('7');

      expect(mockService.delete).toHaveBeenCalledWith(7);
      expect(result).toHaveProperty('id', 7);
    });
  });
});
