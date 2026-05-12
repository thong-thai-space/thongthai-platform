import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { ContentRepository } from './repositories/content.repository';

describe('ContentService', () => {
  let service: ContentService;
  let repository: jest.Mocked<ContentRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: ContentRepository,
          useValue: {
            findAllActive: jest.fn(),
            findBySection: jest.fn(),
            upsert: jest.fn(),
            deleteBySection: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ContentService);
    repository = module.get(ContentRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll uses repository', async () => {
    repository.findAllActive.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toEqual([]);
    expect(repository.findAllActive).toHaveBeenCalled();
  });
});
