import { Test, TestingModule } from '@nestjs/testing';
import { GuestService } from './guest.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GuestService', () => {
  let service: GuestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<GuestService>(GuestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
