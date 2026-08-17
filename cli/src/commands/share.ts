import { CAC } from "cac";
import { shareService } from "../services/share.service.js";

export function registerShareCommands(cli: CAC): void {
  cli
    .command("send <file>", "Send a file directly to another machine")
    .action(async (file) => {
      await shareService.send(file);
    });

  cli
    .command("receive <code>", "Receive a file from a sender's code")
    .option("--out <dir>", "Directory to save into", { default: process.cwd() })
    .action(async (code, options) => {
      await shareService.receive(code, options.out);
    });
}
