import inquirer from "inquirer";
import chalk from "chalk";
import { FileItem } from "../types/index.js";
import { FileUtils } from "./file.utils.js";

export class FileDisplayUtils {
  /**
   * Display detailed file information
   */
  static displayFileDetails(file: FileItem): void {
    console.log("\n--- File Details ---");
    console.log(`  ${chalk.cyan("Name:")} ${file.key}`);
    console.log(`  ${chalk.blueBright("URL:")} ${file.url}`);
    console.log(`  ${chalk.yellow("Size:")} ${FileUtils.formatFileSize(file.size)}`);
    console.log(`  ${chalk.magenta("Last Modified:")} ${FileUtils.formatDate(file.lastModified)}`);
    console.log("--------------------\n");
  }

  /**
   * Show file selection prompt
   */
  static async promptFileSelection(files: FileItem[]): Promise<string> {
    const { selectedFileKey } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedFileKey",
        message: "Select a file to view details (or Exit):",
        choices: [
          ...files.map(file => ({ name: file.key, value: file.key })),
          new inquirer.Separator(),
          { name: "Exit", value: "__exit__" },
        ],
        pageSize: 10,
      },
    ]);
    
    return selectedFileKey;
  }

  /**
   * Show file action prompt
   */
  static async promptFileAction(): Promise<string> {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "Copy URL to clipboard", value: "copy" },
          { name: "Delete this file", value: "delete" },
          new inquirer.Separator(),
          { name: "Back to list", value: "back" },
        ],
      },
    ]);
    
    return action;
  }

  /**
   * Show delete confirmation prompt
   */
  static async promptDeleteConfirmation(fileName: string): Promise<boolean> {
    const { confirmDelete } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDelete",
        message: `Are you sure you want to delete '${fileName}'? This cannot be undone.`,
        default: false,
      },
    ]);
    
    return confirmDelete;
  }
} 