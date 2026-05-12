import { Injectable, NotImplementedException } from '@nestjs/common';
import { ExportGenerator } from './export-generator';

@Injectable()
export class PdfGenerator implements ExportGenerator {
	async generate(_payload: Record<string, unknown>): Promise<Buffer> {
		// TECH DEBT: implement PDF export generation.
		throw new NotImplementedException('PDF export is not implemented yet');
	}
}
