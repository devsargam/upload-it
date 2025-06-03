import { Resend } from 'resend';
import { EmailService } from '../email/email-service';

const resend = new Resend(process.env.RESEND_API_KEY!);
const fromEmail = process.env.RESEND_FROM_EMAIL!;

if (!fromEmail) {
  throw new Error("RESEND_FROM_EMAIL is not set");
}

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
