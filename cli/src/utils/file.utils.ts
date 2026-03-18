import { stat } from "fs/promises";
import path from "path";
import { MessageUtils } from "./messages.js";

export class FileUtils {
  /**
   * Validate if file exists and get its stats
   */
  static async validateAndGetFileStats(filePath: string) {
    try {
      const stats = await stat(filePath);
      const fileName = path.basename(filePath);
      
      if (!stats.isFile()) {
        throw new Error(`${filePath} is not a file`);
      }
      
      return { stats, fileName };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes("ENOENT")) {
        MessageUtils.error(`File not found: ${filePath}`);
      } else {
        MessageUtils.error(`Error accessing file: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Format date in human readable format
   */
  static formatDate(date: string | Date): string {
    return new Date(date).toLocaleString();
  }

  /**
   * Generate file URL from base URL and key
   */
  static generateFileUrl(baseUrl: string, key: string): string {
    return baseUrl + key;
  }
} 