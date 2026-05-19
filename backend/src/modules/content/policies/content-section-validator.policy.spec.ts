import { BadRequestException } from '@nestjs/common';
import { MAX_CONTENT_PAYLOAD_BYTES } from '../content.constants';
import { ContentSectionValidator } from './content-section-validator.policy';

describe('ContentSectionValidator', () => {
  const validator = new ContentSectionValidator();

  it('rejects unknown sections', () => {
    expect(() => validator.validate('not-a-real-section', {})).toThrow(BadRequestException);
  });

  it('rejects null payloads', () => {
    expect(() => validator.validate('hero', null)).toThrow(BadRequestException);
  });

  it('rejects array payloads', () => {
    expect(() => validator.validate('hero', [])).toThrow(BadRequestException);
  });

  it('rejects primitive payloads', () => {
    expect(() => validator.validate('hero', 'a string')).toThrow(BadRequestException);
  });

  it('accepts plain object payload for known section', () => {
    expect(() => validator.validate('hero', { title: 'x' })).not.toThrow();
  });

  it('rejects payloads exceeding the size cap', () => {
    const huge = { blob: 'x'.repeat(MAX_CONTENT_PAYLOAD_BYTES + 100) };
    expect(() => validator.validate('hero', huge)).toThrow(/exceeds/);
  });
});
