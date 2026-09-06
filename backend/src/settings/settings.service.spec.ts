import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    systemSetting: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar as configurações como um objeto chave-valor', async () => {
    mockPrismaService.systemSetting.findMany.mockResolvedValue([
      { key: 'noivoPhone', value: '11999999999' },
      { key: 'noivaPhone', value: '11888888888' },
    ]);

    const result = await service.getSettings();

    expect(prisma.systemSetting.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      noivoPhone: '11999999999',
      noivaPhone: '11888888888',
    });
  });

  it('deve atualizar as configurações e retornar o objeto atualizado', async () => {
    mockPrismaService.systemSetting.upsert.mockResolvedValue({});
    mockPrismaService.systemSetting.findMany.mockResolvedValue([
      { key: 'noivoPhone', value: '123' },
    ]);

    const dataToUpdate = { noivoPhone: '123' };
    const result = await service.updateSettings(dataToUpdate);

    expect(prisma.systemSetting.upsert).toHaveBeenCalledWith({
      where: { key: 'noivoPhone' },
      update: { value: '123' },
      create: { key: 'noivoPhone', value: '123' },
    });
    expect(prisma.systemSetting.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ noivoPhone: '123' });
  });
});
