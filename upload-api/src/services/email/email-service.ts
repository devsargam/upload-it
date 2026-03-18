import { Context } from "hono";
import { AppEnv } from "@/types/app";

export interface EmailService {
    sendEmail(email: string, template: string, c: Context<AppEnv>): Promise<void>;
    sendBatchEmails(emails: string[], templates: string[], c: Context<AppEnv>): Promise<void>;
}