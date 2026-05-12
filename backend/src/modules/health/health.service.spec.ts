import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { HealthRepository } from './repositories/health.repository';

const mockRepository = {
  checkDatabase: jest.fn(),
  checkRedis: jest.fn(),
  disconnect: jest.fn(),
};

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: HealthRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('live returns ok payload', () => {
    const result = service.live();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('backend');
  });

  it('ready returns ok when checks succeed', async () => {
    mockRepository.checkDatabase.mockResolvedValue({ status: 'up' });
    mockRepository.checkRedis.mockResolvedValue({ status: 'up' });

    const result = await service.ready();
    expect(result.status).toBe('ok');
  });
});
