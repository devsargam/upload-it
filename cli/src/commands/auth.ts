import { CAC } from "cac";
import { authService } from "../services/auth.service.js";

export function registerAuthCommands(cli: CAC): void {
  cli
    .command("login", "Authenticate with your email")
    .action(async () => {
      await authService.login();
    });

  cli
    .command("logout", "Clear stored credentials")
    .action(() => {
      authService.logout();
    });
} 