import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendInvitation(opts: {
    to: string;
    inviterName: string;
    inviteUrl: string;
  }): Promise<void> {
    const { to, inviterName, inviteUrl } = opts;

    if (!this.resend) {
      this.logger.warn(
        `[MailService] RESEND_API_KEY not configured. Invitation URL for ${to}: ${inviteUrl}`,
      );
      return;
    }

    const fromAddress =
      this.config.get<string>('MAIL_FROM') ??
      'Thông Thái Space <noreply@thongthai.space>';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Bạn được mời tham gia Thông Thái Space</h2>
        <p><strong>${inviterName}</strong> đã mời bạn tham gia nhóm trên Thông Thái Space.</p>
        <p>Nhấn vào nút bên dưới để chấp nhận lời mời và thiết lập tài khoản của bạn:</p>
        <a href="${inviteUrl}"
           style="display:inline-block;background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Chấp nhận lời mời
        </a>
        <p style="color:#6b7280;font-size:13px;">
          Liên kết này có hiệu lực trong 7 ngày. Nếu bạn không yêu cầu lời mời này, hãy bỏ qua email này.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#9ca3af;font-size:12px;">Thông Thái Space — Nền tảng quản lý dự án</p>
      </div>
    `;

    try {
      await this.resend.emails.send({
        from: fromAddress,
        to,
        subject: `${inviterName} đã mời bạn tham gia Thông Thái Space`,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send invitation email to ${to}`, err);
    }
  }
}
