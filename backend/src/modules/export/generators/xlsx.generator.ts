import { Injectable, NotImplementedException } from '@nestjs/common';
import { ExportGenerator } from './export-generator';

@Injectable()
export class XlsxGenerator implements ExportGenerator {
  async generate(_payload: Record<string, unknown>): Promise<Buffer> {
    // TECH DEBT: implement XLSX export generation.
    throw new NotImplementedException('XLSX export is not implemented yet');
  }
}
