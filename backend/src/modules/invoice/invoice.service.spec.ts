import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

const mockPrisma = {
  invoice: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should filter by clientId for CLIENT role', async () => {
      const invoices = [{ id: 'inv1' }];
      mockPrisma.invoice.findMany.mockResolvedValue(invoices);

      const result = await service.findAll('client-1', UserRole.CLIENT);
      expect(result).toEqual(invoices);
      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: 'client-1' },
        }),
      );
    });

    it('should return all invoices for OWNER role', async () => {
      const invoices = [{ id: 'inv1' }, { id: 'inv2' }];
      mockPrisma.invoice.findMany.mockResolvedValue(invoices);

      const result = await service.findAll('owner-1', UserRole.OWNER);
      expect(result).toEqual(invoices);
      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return invoice with relations', async () => {
      const invoice = { id: 'inv1', invoiceNumber: 'INV-2026-0001' };
      mockPrisma.invoice.findUnique.mockResolvedValue(invoice);

      const result = await service.findOne('inv1');
      expect(result).toEqual(invoice);
    });

    it('should throw NotFoundException for missing invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create invoice with auto-generated number', async () => {
      mockPrisma.invoice.count.mockResolvedValue(5);
      mockPrisma.invoice.create.mockResolvedValue({
        id: 'inv1',
        invoiceNumber: `INV-${new Date().getFullYear()}-0006`,
      });

      const dto = {
        clientId: 'c1',
        projectId: 'p1',
        total: 1000,
        items: [{ description: 'Item 1', amount: 1000 }],
      };
      const result = await service.create(dto as any, 'creator-1');

      expect(result.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creatorId: 'creator-1',
            items: { create: [{ description: 'Item 1', amount: 1000 }] },
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update basic invoice fields', async () => {
      const updated = { id: 'inv1', notes: 'Updated' };
      mockPrisma.invoice.update.mockResolvedValue(updated);

      const result = await service.update('inv1', { notes: 'Updated' } as any);
      expect(result).toEqual(updated);
    });

    it('should set paidAt and paidAmount when status is PAID', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv1',
        total: 5000,
      });
      mockPrisma.invoice.update.mockResolvedValue({
        id: 'inv1',
        status: 'PAID',
        paidAt: new Date(),
        paidAmount: 5000,
      });

      const result = await service.update('inv1', { status: 'PAID' } as any);
      expect(result.status).toBe('PAID');
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PAID',
            paidAt: expect.any(Date),
            paidAmount: 5000,
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should hard-delete invoice', async () => {
      mockPrisma.invoice.delete.mockResolvedValue({ id: 'inv1' });

      const result = await service.remove('inv1');
      expect(result).toEqual({ id: 'inv1' });
    });
  });
});
