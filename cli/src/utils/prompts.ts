import inquirer from "inquirer";
import { validateEmail, validateOtp } from "./validation.js";
import { messages } from "./messages.js";

export class PromptUtils {
  static async getEmail(): Promise<string> {
    const { email } = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: messages.prompts.enterEmail,
        validate: validateEmail,
      },
    ]);
    return email;
  }

  static async getOtp(): Promise<string> {
    const { otp } = await inquirer.prompt([
      {
        type: "input",
        name: "otp",
        message: messages.prompts.enterVerificationCode,
        validate: validateOtp,
      },
    ]);
    return otp;
  }
} 