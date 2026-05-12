import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { PortfolioRepository } from './repositories/portfolio.repository';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let repository: jest.Mocked<PortfolioRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PortfolioRepository,
          useValue: {
            findShowcaseProjects: jest.fn(),
            updateShowcaseProject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PortfolioService);
    repository = module.get(PortfolioRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getShowcase uses repository', async () => {
    repository.findShowcaseProjects.mockResolvedValue([] as any);

    await expect(service.getShowcase()).resolves.toEqual([]);
    expect(repository.findShowcaseProjects).toHaveBeenCalled();
  });
});
