import { Resend } from 'resend';
import { EmailService } from '@/services/email/email-service';
import { Context } from 'hono';
import { AppEnv } from '@/types/app';

export class ResendEmailService implements EmailService {
  async sendEmail(email: string, template: string, c: Context<AppEnv>): Promise<void> {
    const resend = new Resend(c.env.RESEND_API_KEY!);
    const fromEmail = c.env.RESEND_FROM_EMAIL!;

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Verify your Upload-It account',
      text: template,
    });
  }

  async sendBatchEmails(emails: string[], templates: string[], c: Context<AppEnv>): Promise<void> {
    const resend = new Resend(c.env.RESEND_API_KEY!);
    const fromEmail = c.env.RESEND_FROM_EMAIL!;

    const batchEmails = emails.map((email, index) => ({
      from: fromEmail,
      to: [email],
      subject: 'Your Email Subject',
      html: templates[index] || '',
    }));

    await resend.batch.send(batchEmails);
  }
}
