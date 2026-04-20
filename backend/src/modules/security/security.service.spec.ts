import { Test, TestingModule } from '@nestjs/testing';
import { TurnstileService } from '../../common/turnstile/turnstile.service';
import { SecurityService } from './security.service';

describe('SecurityService', () => {
  let service: SecurityService;

  const mockTurnstileService = {
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        { provide: TurnstileService, useValue: mockTurnstileService },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('verifyTurnstileToken should delegate to TurnstileService', async () => {
    mockTurnstileService.verifyToken.mockResolvedValue(true);

    const result = await service.verifyTurnstileToken('token-123', '127.0.0.1');

    expect(mockTurnstileService.verifyToken).toHaveBeenCalledWith('token-123', '127.0.0.1');
    expect(result).toBe(true);
  });
});
