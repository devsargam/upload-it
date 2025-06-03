import { EmailService } from '../email/email-service';
import { ResendEmailService } from "./resend-service";
import { generateOTPTemplate } from '../../templates/otp-template';

const emailService: EmailService = new ResendEmailService();

interface SendConfirmationMailParams {
  email: string;
  otp: string;
}

export const sendConfirmationMail = async ({ email, otp }: SendConfirmationMailParams): Promise<void> => {
  const template = generateOTPTemplate(otp);
  await emailService.sendEmail(email, template);
};
