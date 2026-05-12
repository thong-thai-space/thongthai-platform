import { EmailTemplateService } from './email-template.service';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;

  beforeEach(() => {
    service = new EmailTemplateService();
  });

  it('buildVerificationHtml contains name and url', () => {
    const html = service.buildVerificationHtml('Thai', 'https://example.com/verify');
    expect(html).toContain('Thai');
    expect(html).toContain('https://example.com/verify');
  });

  it('buildResetPasswordHtml contains name and url', () => {
    const html = service.buildResetPasswordHtml('Thai', 'https://example.com/reset');
    expect(html).toContain('Thai');
    expect(html).toContain('https://example.com/reset');
  });
});
