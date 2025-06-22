import { EmailService } from '@/services/email/email-service';
import { ResendEmailService } from '@/services/resend/resend-service';
import { generateOTPTemplate } from '@/services/email/templates/otp-template';
import { SendConfirmationMailParams } from '@/types/email';
import { Context } from 'hono';
import { AppEnv } from '@/types/app';

const emailService: EmailService = new ResendEmailService();

export const sendConfirmationMail = async ({ email, otp, c }: SendConfirmationMailParams & { c: Context<AppEnv> }): Promise<void> => {
  const template = generateOTPTemplate(otp);
  await emailService.sendEmail(email, template, c);
};
