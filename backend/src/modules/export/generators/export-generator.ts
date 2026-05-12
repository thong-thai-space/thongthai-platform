export interface ExportGenerator {
  generate(payload: Record<string, unknown>): Promise<Buffer>;
}
