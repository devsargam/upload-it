import inquirer from "inquirer";
import { validateEmail, validateOtp } from "./validation.js";
import { messages } from "./messages.js";

export type ConflictChoice = "overwrite" | "keep-both" | "cancel";

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

  static async resolveFileConflict(fileName: string, renamedTo: string): Promise<ConflictChoice> {
    const { choice } = await inquirer.prompt([
      {
        type: "list",
        name: "choice",
        message: `"${fileName}" already exists. What do you want to do?`,
        choices: [
          { name: `Keep both (save as "${renamedTo}")`, value: "keep-both" },
          { name: "Replace the existing file", value: "overwrite" },
          { name: "Cancel", value: "cancel" },
        ],
      },
    ]);
    return choice;
  }
} 