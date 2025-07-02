import { config } from "../config.js";
import { authService } from "./auth.service.js";
import { storageService } from "./storage.service.js";
import { ApiService } from "./api.service.js";
import { createSpinner } from "../utils/spinner.js";
import { MessageUtils, messages } from "../utils/messages.js";
import { FileUtils } from "../utils/file.utils.js";
import { ClipboardUtils } from "../utils/clipboard.utils.js";
import { FileDisplayUtils } from "../utils/file-display.utils.js";
import { FileItem } from "../types/index.js";

export class FileService {
  /**
   * Upload a file to the server
   */
  async uploadFile(filePath: string): Promise<void> {
    try {
      const token = await authService.authenticate();
      const { stats, fileName } = await FileUtils.validateAndGetFileStats(filePath);
      
      const presignedUrlData = await this.getPresignedUrl(fileName, token);
      await this.performFileUpload(presignedUrlData.presignedUrl, filePath, stats.size);
      
      MessageUtils.success(messages.files.uploadSuccessful);
      const fileUrl = FileUtils.generateFileUrl(config.BASE_FILE_URL, fileName);
      MessageUtils.info(`File URL: ${fileUrl}`);
    } catch (error) {
      MessageUtils.errorWithLabel("Upload Error", (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Get presigned URL for file upload
   */
  private async getPresignedUrl(fileName: string, token: string) {
    const spinner = createSpinner(messages.files.gettingUploadUrl).start();
    try {
      const data = await ApiService.getPresignedUrl(fileName, token);
      spinner.succeed();
      return data;
    } catch (error) {
      spinner.fail("Failed to get upload URL");
      throw error;
    }
  }

  /**
   * Perform the actual file upload
   */
  private async performFileUpload(presignedUrl: string, filePath: string, fileSize: number) {
    const spinner = createSpinner(messages.files.uploading).start();
    try {
      await ApiService.uploadFile(presignedUrl, filePath, fileSize);
      spinner.succeed();
    } catch (error) {
      spinner.fail("File upload failed");
      throw error;
    }
  }

  /**
   * List and manage files interactively
   */
  async listFiles(): Promise<void> {
    if (!storageService.hasToken()) {
      MessageUtils.warning(messages.auth.needsLogin);
      MessageUtils.info(messages.auth.authenticating);
      return;
    }

    const filesCache = await this.fetchFilesList();
    if (!filesCache.length) {
      return;
    }

    await this.handleFileListInteraction(filesCache);
  }

  /**
   * Fetch the list of files from the server
   */
  private async fetchFilesList(): Promise<FileItem[]> {
    const spinner = createSpinner(messages.files.fetchingList).start();
    
    try {
      const token = await authService.authenticate();
      const data = await ApiService.listFiles(token);

      if (!(data.files && data.files.length > 0)) {
        spinner.info(messages.files.noFilesFound);
        return [];
      }
      
      spinner.succeed(messages.files.listFetched);
      
      return data.files.map((file) => ({
        ...file,
        url: FileUtils.generateFileUrl(config.BASE_FILE_URL, file.key),
      }));
    } catch (error) {
      spinner.fail("Failed to fetch file list");
      MessageUtils.errorWithLabel("Error", (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Handle interactive file list navigation
   */
  private async handleFileListInteraction(filesCache: FileItem[]): Promise<void> {
    let shouldContinue = true;

    while (shouldContinue) {
      console.log("\n");
      const selectedFileKey = await FileDisplayUtils.promptFileSelection(filesCache);

      if (selectedFileKey === "__exit__") {
        shouldContinue = false;
        MessageUtils.warning(messages.files.exitingFileList);
      } else {
        const selectedFile = filesCache.find(file => file.key === selectedFileKey);
        if (selectedFile) {
          const updatedCache = await this.handleFileDetailView(selectedFile, filesCache);
          filesCache.splice(0, filesCache.length, ...updatedCache);
        }
      }
    }
  }

  /**
   * Handle file detail view and actions
   */
  private async handleFileDetailView(selectedFile: FileItem, filesCache: FileItem[]): Promise<FileItem[]> {
    let inDetailView = true;
    let currentCache = [...filesCache];

    while (inDetailView) {
      FileDisplayUtils.displayFileDetails(selectedFile);
      const action = await FileDisplayUtils.promptFileAction();

      switch (action) {
        case "copy":
          await ClipboardUtils.copyUrl(selectedFile.url);
          break;
          
        case "delete":
          const shouldDelete = await FileDisplayUtils.promptDeleteConfirmation(selectedFile.key);
          if (shouldDelete) {
            const success = await this.deleteFile(selectedFile.key);
            if (success) {
              currentCache = currentCache.filter(f => f.key !== selectedFile.key);
              inDetailView = false;
            }
          } else {
            MessageUtils.warning(messages.files.deletionCancelled);
          }
          break;
          
        case "back":
          inDetailView = false;
          break;
      }
    }

    return currentCache;
  }

  /**
   * Delete a file from the server
   */
  private async deleteFile(fileName: string): Promise<boolean> {
    const spinner = createSpinner(`Deleting '${fileName}'...`).start();
    
    try {
      const token = storageService.getToken() as string;
      const deleteData = await ApiService.deleteFile(fileName, token);

      if (deleteData.success) {
        spinner.succeed(deleteData.message || `File '${fileName}' deleted successfully.`);
        return true;
      } else {
        spinner.fail(deleteData.message || `Failed to delete '${fileName}'.`);
        return false;
      }
    } catch (error) {
      spinner.fail(`Failed to delete '${fileName}'.`);
      MessageUtils.errorWithLabel("Delete Error", (error as Error).message);
      return false;
    }
  }
}

export const fileService = new FileService(); 