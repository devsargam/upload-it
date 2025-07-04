import { createSpinner } from "../utils/spinner.js";
import { MessageUtils, messages } from "../utils/messages.js";
import { PromptUtils } from "../utils/prompts.js";
import { ApiService } from "./api.service.js";
import { storageService } from "./storage.service.js";

export class AuthService {
  /**
   * Get existing token or perform full authentication flow
   */
  async authenticate(): Promise<string> {
    if (storageService.hasToken()) {
      return storageService.getToken() as string;
    }

    return await this.performAuthenticationFlow();
  }

  /**
   * Handle the complete authentication flow
   */
  private async performAuthenticationFlow(): Promise<string> {
    try {
      const email = await PromptUtils.getEmail();
      await this.sendVerificationCode(email);
      
      const otp = await PromptUtils.getOtp();
      const token = await this.verifyEmailAndGetToken(email, otp);
      
      storageService.setToken(token);
      return token;
    } catch (error) {
      this.handleAuthenticationError(error as Error);
      throw error;
    }
  }

  /**
   * Send verification code to email
   */
  private async sendVerificationCode(email: string): Promise<void> {
    const spinner = createSpinner(messages.auth.sendingVerificationCode).start();
    try {
      await ApiService.sendVerificationCode(email);
      spinner.succeed(messages.auth.verificationCodeSent);
    } catch (error) {
      spinner.fail(messages.auth.authenticationFailed);
      throw error;
    }
  }

  /**
   * Verify email with OTP and get authentication token
   */
  private async verifyEmailAndGetToken(email: string, otp: string): Promise<string> {
    const spinner = createSpinner(messages.auth.verifyingCode).start();
    try {
      const verifyData = await ApiService.verifyEmail(email, otp);
      
      if (verifyData.isValid) {
        spinner.succeed(messages.auth.authenticationSuccessful);
        return verifyData.token;
      } else {
        spinner.fail(messages.auth.invalidVerificationCode);
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(messages.auth.authenticationFailed);
      throw error;
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthenticationError(error: Error): void {
    MessageUtils.errorWithLabel("Error", error.message);
  }

  /**
   * Public login method
   */
  async login(): Promise<void> {
    if (storageService.hasToken()) {
      MessageUtils.success(messages.auth.alreadyLoggedIn);
      return;
    }
    
    try {
      await this.authenticate();
      MessageUtils.success(messages.auth.loginSuccessful);
    } catch (error) {
      MessageUtils.errorWithLabel(messages.auth.loginFailed, (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Public logout method
   */
  logout(): void {
    if (!storageService.hasToken()) {
      MessageUtils.warning(messages.auth.alreadyLoggedOut);
      return;
    }
    
    storageService.clearToken();
    MessageUtils.success(messages.auth.logoutSuccessful);
  }
}

export const authService = new AuthService(); 