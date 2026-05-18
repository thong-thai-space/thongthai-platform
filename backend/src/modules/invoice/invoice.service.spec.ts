import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from './invoice.service';
import { InvoiceUseCases } from './use-cases/invoice.use-cases';
import { CreateInvoiceDto } from './dto/invoice.dto';
import { UserRole } from '@prisma/client';

const mockUseCases = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: InvoiceUseCases, useValue: mockUseCases },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should filter by clientId for CLIENT role', async () => {
      mockUseCases.findAll.mockResolvedValue([]);

      await service.findAll('client-1', UserRole.CLIENT);
      expect(mockUseCases.findAll).toHaveBeenCalledWith(
        'client-1',
        UserRole.CLIENT,
      );
    });
  });

  describe('create', () => {
    it('should delegate to use-cases', async () => {
      const dto: CreateInvoiceDto = {
        clientId: 'c1',
        dueDate: new Date().toISOString(),
        items: [{ description: 'Item 1', unitPrice: 1000 }],
      };
      mockUseCases.create.mockResolvedValue({ id: 'inv1' });

      await service.create(dto, 'creator-1');
      expect(mockUseCases.create).toHaveBeenCalledWith(dto, 'creator-1');
    });
  });
});
