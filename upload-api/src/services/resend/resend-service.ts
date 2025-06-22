import { Resend } from 'resend';
import { EmailService } from '@/services/email/email-service';
import { config } from '@/lib/config';

const resend = new Resend(config.resend.apiKey);
const fromEmail = config.resend.fromEmail;

export class ResendEmailService implements EmailService {
  async sendEmail(email: string, template: string): Promise<void> {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Verify your Upload-It account',
      html: template,
    });
  }

  async sendBatchEmails(emails: string[], templates: string[]): Promise<void> {
    const batchEmails = emails.map((email, index) => ({
      from: fromEmail,
      to: [email],
      subject: 'Your Email Subject',
      html: templates[index] || '',
    }));

    await resend.batch.send(batchEmails);
  }
}
