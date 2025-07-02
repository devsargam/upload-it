import { CAC } from "cac";
import { fileService } from "../services/file.service.js";

export function registerListCommand(cli: CAC): void {
  cli
    .command("list", "List uploaded files interactively")
    .action(async () => {
      await fileService.listFiles();
    });
} 