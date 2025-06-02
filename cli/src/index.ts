#!/usr/bin/env node
import { cac } from "cac";
import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import axios, { AxiosError } from "axios";
import Conf from "conf";
import { config } from "./config.js";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      },
    });

    spinner.succeed("File uploaded successfully!");
    console.log(chalk.green("\nFile URL:"), data.presignedUrl);
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
  .command("logout", "Clear stored credentials")
  .action(() => {
    store.clear();
    console.log(chalk.green("Successfully logged out!"));
  });

cli.help();
cli.parse();
