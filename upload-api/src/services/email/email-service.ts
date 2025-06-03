export interface EmailService {
    sendEmail(email: string, template: string): Promise<void>;
    sendBatchEmails(emails: string[], templates: string[]): Promise<void>;
}