import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { ExportFormat } from './dto/export.dto';
import { PdfGenerator } from './generators/pdf.generator';
import { DocxGenerator } from './generators/docx.generator';
import { XlsxGenerator } from './generators/xlsx.generator';

describe('ExportService', () => {
  let service: ExportService;
  let pdfGenerator: jest.Mocked<PdfGenerator>;
  let docxGenerator: jest.Mocked<DocxGenerator>;
  let xlsxGenerator: jest.Mocked<XlsxGenerator>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: PdfGenerator, useValue: { generate: jest.fn() } },
        { provide: DocxGenerator, useValue: { generate: jest.fn() } },
        { provide: XlsxGenerator, useValue: { generate: jest.fn() } },
      ],
    }).compile();

    service = module.get(ExportService);
    pdfGenerator = module.get(PdfGenerator);
    docxGenerator = module.get(DocxGenerator);
    xlsxGenerator = module.get(XlsxGenerator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('routes PDF export to pdf generator', async () => {
    pdfGenerator.generate.mockResolvedValue(Buffer.from(''));

    await service.generate({ format: ExportFormat.PDF, data: {} });
    expect(pdfGenerator.generate).toHaveBeenCalled();
  });

  it('routes DOCX export to docx generator', async () => {
    docxGenerator.generate.mockResolvedValue(Buffer.from(''));

    await service.generate({ format: ExportFormat.DOCX, data: {} });
    expect(docxGenerator.generate).toHaveBeenCalled();
  });

  it('routes XLSX export to xlsx generator', async () => {
    xlsxGenerator.generate.mockResolvedValue(Buffer.from(''));

    await service.generate({ format: ExportFormat.XLSX, data: {} });
    expect(xlsxGenerator.generate).toHaveBeenCalled();
  });
});
