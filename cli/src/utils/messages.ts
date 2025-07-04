import chalk from "chalk";

export class MessageUtils {
  static success(message: string): void {
    console.log(chalk.green(message));
  }

  static error(message: string): void {
    console.error(chalk.red(message));
  }

  static warning(message: string): void {
    console.log(chalk.yellow(message));
  }

  static info(message: string): void {
    console.log(chalk.blue(message));
  }

  static errorWithLabel(label: string, message: string): void {
    console.error(chalk.red(`${label}:`), message);
  }
}

export const messages = {
  auth: {
    alreadyLoggedIn: "You are already logged in!",
    alreadyLoggedOut: "You are already logged out!",
    loginSuccessful: "Login successful!",
    logoutSuccessful: "Successfully logged out!",
    authenticationSuccessful: "Successfully authenticated!",
    verificationCodeSent: "Verification code sent!",
    sendingVerificationCode: "Sending verification code...",
    verifyingCode: "Verifying code...",
    invalidVerificationCode: "Invalid verification code",
    authenticationFailed: "Authentication failed",
    loginFailed: "Login failed",
    needsLogin: "You need to be logged in to perform this action.",
    authenticating: "Please authenticate to continue...",
  },
  files: {
    uploadSuccessful: "File uploaded successfully!",
    gettingUploadUrl: "Getting upload URL...",
    uploading: "Uploading file...",
    fetchingList: "Fetching file list...",
    listFetched: "Fetched file list.",
    noFilesFound: "No files found.",
    deletionCancelled: "Deletion cancelled.",
    exitingFileList: "Exiting file list view.",
  },
  prompts: {
    enterEmail: "Enter your email:",
    enterVerificationCode: "Enter the verification code:",
  },
} as const; 