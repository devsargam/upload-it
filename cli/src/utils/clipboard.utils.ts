import clipboardy from "clipboardy";
import { MessageUtils } from "./messages.js";

export class ClipboardUtils {
  /**
   * Copy text to clipboard with error handling
   */
  static async copyToClipboard(text: string, description = "text"): Promise<boolean> {
    try {
      await clipboardy.write(text);
      MessageUtils.success(`${description} copied to clipboard!`);
      return true;
    } catch (error) {
      MessageUtils.error(`Error copying ${description} to clipboard: ${(error as Error).message}`);
      MessageUtils.warning(`You can manually copy the ${description} from above.`);
      return false;
    }
  }

  /**
   * Copy URL to clipboard
   */
  static async copyUrl(url: string): Promise<boolean> {
    return this.copyToClipboard(url, "URL");
  }
} 