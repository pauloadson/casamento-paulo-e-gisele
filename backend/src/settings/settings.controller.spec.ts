import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  const mockSettingsService = {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar getSettings do serviço', async () => {
    const mockResult = { noivoPhone: '123' };
    mockSettingsService.getSettings.mockResolvedValue(mockResult);

    const result = await controller.getSettings();

    expect(service.getSettings).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResult);
  });

  it('deve chamar updateSettings do serviço com o body enviado', async () => {
    const mockBody = { noivoPhone: '123', noivaPhone: '456' };
    mockSettingsService.updateSettings.mockResolvedValue(mockBody);

    const result = await controller.updateSettings(mockBody);

    expect(service.updateSettings).toHaveBeenCalledWith(mockBody);
    expect(result).toEqual(mockBody);
  });
});
