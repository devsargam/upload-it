#!/usr/bin/env node
import { cac } from "cac";
import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import axios, { AxiosError } from "axios";
import Conf from "conf";
import clipboardy from "clipboardy";
import { config } from "./config.js";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";

const cli = cac("upload-it");
const store = new Conf<{ token: string }>({ projectName: "upload-it" });

async function authenticate() {
  if (store.has("token")) {
    return store.get("token") as string;
  }

  const { email } = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "Enter your email:",
      validate: (input) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) || "Please enter a valid email";
      },
    },
  ]);

  const spinner = ora("Sending verification code...").start();
  try {
    const { data } = await axios.post(`${config.API_URL}${config.endpoints.confirm}`, { email });
    spinner.succeed("Verification code sent!");

    const { otp } = await inquirer.prompt([
      {
        type: "input",
        name: "otp",
        message: "Enter the verification code:",
        validate: (input) => /^\d{6}$/.test(input) || "Please enter a valid 6-digit code",
      },
    ]);

    spinner.start("Verifying code...");
    const { data: verifyData } = await axios.post(`${config.API_URL}${config.endpoints.verifyEmail}`, {
      email,
      otp,
    });

    if (verifyData.isValid) {
      store.set("token", verifyData.token);
      spinner.succeed("Successfully authenticated!");
      return verifyData.token;
    } else {
      spinner.fail("Invalid verification code");
      process.exit(1);
    }
  } catch (error) {
    spinner.fail("Authentication failed");
    console.error(chalk.red("Error:"), (error as AxiosError).message);
    process.exit(1);
  }
}

async function uploadFile(filePath: string) {
  try {
    const token = await authenticate();
    const stats = await stat(filePath);
    const fileName = path.basename(filePath);

    const spinner = ora("Getting upload URL...").start();
    const { data } = await axios.post(
      `${config.API_URL}${config.endpoints.presignedUrl}`,
      { key: fileName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    spinner.text = "Uploading file...";
    await axios.put(data.presignedUrl, createReadStream(filePath), {
      headers: {
        "Content-Length": stats.size,
        "Content-Type": "application/octet-stream",
      },
    });

    spinner.succeed("File uploaded successfully!");
    console.log(chalk.green("\nFile URL:"), config.BASE_FILE_URL + fileName);
  } catch (error) {
    console.error(chalk.red("Error:"), (error as AxiosError).message);
    process.exit(1);
  }
}

cli
  .command("<file>", "Upload a file")
  .action(async (file) => {
    await uploadFile(file);
  });

cli
  .command("login", "Authenticate with your email")
  .action(async () => {
    if (store.has("token")) {
      console.log(chalk.green("You are already logged in!"));
      return;
    }
    
    try {
      await authenticate();
      console.log(chalk.green("Login successful!"));
    } catch (error) {
      console.error(chalk.red("Login failed:"), (error as Error).message);
      process.exit(1);
    }
  });

cli
  .command("logout", "Clear stored credentials")
  .action(() => {
    store.clear();
    console.log(chalk.green("Successfully logged out!"));
  });

cli
  .command("list", "List uploaded files interactively")
  .action(async () => {
    if (!store.has("token")) {
      console.log(chalk.yellow("You need to be logged in to list files."));
      console.log(chalk.cyan("Please authenticate to continue...\n"));
      return;
    }

    let shouldContinue = true;
    const spinner = ora("Fetching file list...").start();
    let filesCache: Array<{ key: string; lastModified: string; size: number; url: string }> = [];

    try {
      const token = await authenticate(); // Authenticate once
      const { data: initialData } = await axios.get(
        `${config.API_URL}${config.endpoints.listFiles}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!(initialData.files && initialData.files.length > 0)) {
        spinner.info("No files found.");
        return;
      }
      spinner.succeed("Fetched file list.");

      filesCache = initialData.files.map((file: any) => ({
        ...file,
        url: config.BASE_FILE_URL + file.key,
      }));

    } catch (error) {
      spinner.fail("Failed to fetch initial file list");
      console.error(chalk.red("Error:"), (error as AxiosError).message);
      process.exit(1);
    }

    while (shouldContinue) {
      console.log("\n"); // Add some spacing
      const { selectedFileKey } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedFileKey",
          message: "Select a file to view details (or Exit):",
          choices: [
            ...filesCache.map(file => ({ name: file.key, value: file.key })),
            new inquirer.Separator(),
            { name: "Exit", value: "__exit__" },
          ],
          pageSize: 10,
        },
      ]);

      if (selectedFileKey === "__exit__") {
        shouldContinue = false;
        console.log(chalk.yellow("Exiting file list view."));
      } else {
        const selectedFile = filesCache.find(file => file.key === selectedFileKey);
        if (selectedFile) {
          console.log("\n--- File Details ---");
          console.log(`  ${chalk.cyan("Name:")} ${selectedFile.key}`);
          console.log(`  ${chalk.blueBright("URL:")} ${selectedFile.url}`);
          console.log(`  ${chalk.yellow("Size:")} ${(selectedFile.size / 1024).toFixed(2)} KB`);
          console.log(`  ${chalk.magenta("Last Modified:")} ${new Date(selectedFile.lastModified).toLocaleString()}`);
          console.log("--------------------\n");

          let inDetailView = true;
          while (inDetailView) {
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

            if (action === "copy") {
              try {
                await clipboardy.write(selectedFile.url);
                console.log(chalk.green("URL copied to clipboard!"));
              } catch (err) {
                console.error(chalk.red("Error copying to clipboard:"), (err as Error).message);
                console.log(chalk.yellow("You can manually copy the URL from above."));
              }
            } else if (action === "delete") {
              const { confirmDelete } = await inquirer.prompt([
                {
                  type: "confirm",
                  name: "confirmDelete",
                  message: `Are you sure you want to delete '${selectedFile.key}'? This cannot be undone.`,
                  default: false,
                },
              ]);

              if (confirmDelete) {
                const spinner = ora(`Deleting '${selectedFile.key}'...`).start();
                try {
                  const token = store.get("token") as string; // Token should be available from initial auth
                  const url = `${config.API_URL}${config.endpoints.deleteFile}/${selectedFile.key}`;
                  const { data: deleteData } = await axios.delete(url, {
                    headers: { Authorization: `Bearer ${token}` },
                  });

                  if (deleteData.success) {
                    spinner.succeed(deleteData.message || `File '${selectedFile.key}' deleted successfully.`);
                    // Remove from cache and go back to list
                    filesCache = filesCache.filter(f => f.key !== selectedFile.key);
                    inDetailView = false; // Exit detail view
                  } else {
                    spinner.fail(deleteData.message || `Failed to delete '${selectedFile.key}'.`);
                  }
                } catch (err) {
                  spinner.fail(`Failed to delete '${selectedFile.key}'.`);
                  if (axios.isAxiosError(err) && err.response) {
                    console.error(chalk.red("Error details:"), err.response.data?.message || err.message);
                  } else {
                    console.error(chalk.red("Error:"), (err as Error).message);
                  }
                }
              } else {
                console.log(chalk.yellow("Deletion cancelled."));
              }
            } else if (action === "back") {
              inDetailView = false; // Exit detail view, go back to file list
            }
          }
        }
      }
    }
  });

cli.help();
cli.parse();
