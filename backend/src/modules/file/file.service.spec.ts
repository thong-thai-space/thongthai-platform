import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from './file.service';
import { FileRepository } from './repositories/file.repository';
import { R2StorageService } from '../../shared/storage/r2-storage.service';

const mockStorage = {
  uploadPublicFile: jest.fn(),
};

describe('FileService', () => {
  let service: FileService;
  let repository: jest.Mocked<FileRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: FileRepository,
          useValue: {
            findByProject: jest.fn(),
            findFileWithProject: jest.fn(),
            findFileProjectId: jest.fn(),
            createFile: jest.fn(),
            deleteFile: jest.fn(),
            findProjectAccess: jest.fn(),
          },
        },
        {
          provide: R2StorageService,
          useValue: mockStorage,
        },
      ],
    }).compile();

    service = module.get(FileService);
    repository = module.get(FileRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findByProject uses repository', async () => {
    repository.findByProject.mockResolvedValue([] as any);

    await expect(service.findByProject('p1')).resolves.toEqual([]);
    expect(repository.findByProject).toHaveBeenCalledWith('p1');
  });
});
