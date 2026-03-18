import { CAC } from "cac";
import { fileService } from "../services/file.service.js";

export function registerUploadCommand(cli: CAC): void {
  cli
    .command("<file>", "Upload a file")
    .action(async (file) => {
      await fileService.uploadFile(file);
    });
} 