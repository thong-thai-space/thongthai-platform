import { Injectable, NotImplementedException } from '@nestjs/common';
import { ExportGenerator } from './export-generator';

@Injectable()
export class DocxGenerator implements ExportGenerator {
	async generate(_payload: Record<string, unknown>): Promise<Buffer> {
		// TECH DEBT: implement DOCX export generation.
		throw new NotImplementedException('DOCX export is not implemented yet');
	}
}
