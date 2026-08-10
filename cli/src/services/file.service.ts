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
      const { stats, fileName } = await FileUtils.validateAndGetFileStats(filePath);
      const isLoggedIn = storageService.hasToken();

      let presignedUrlData;
      if (isLoggedIn) {
        const token = storageService.getToken() as string;
        try {
          presignedUrlData = await this.getPresignedUrl(fileName, token);
        } catch (error) {
          if (this.isExpiredAuthError(error)) {
            storageService.clearToken();
            MessageUtils.warning("Stored login expired. Continuing with anonymous upload.");
            presignedUrlData = await this.getAnonPresignedUrl(fileName);
          } else {
            throw error;
          }
        }
      } else {
        presignedUrlData = await this.getAnonPresignedUrl(fileName);
      }

      if (!isLoggedIn || !storageService.hasToken()) {
        MessageUtils.warning("Uploading anonymously — file expires in 24h. Login for 7-day storage.");
      }

      await this.performFileUpload(presignedUrlData.presignedUrl, filePath, stats.size);

      MessageUtils.success(messages.files.uploadSuccessful);
      const fileUrl = FileUtils.generateFileUrl(config.BASE_FILE_URL, presignedUrlData.key);
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

  private async getAnonPresignedUrl(fileName: string) {
    const spinner = createSpinner(messages.files.gettingUploadUrl).start();
    try {
      const data = await ApiService.getAnonPresignedUrl(fileName);
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
    const totalSize = FileUtils.formatFileSize(fileSize);
    try {
      await ApiService.uploadFile(presignedUrl, filePath, fileSize, (bytesUploaded) => {
        const percent = fileSize > 0 ? Math.min(100, Math.floor((bytesUploaded / fileSize) * 100)) : 100;
        spinner.text = `${messages.files.uploading} ${percent}% (${FileUtils.formatFileSize(bytesUploaded)} / ${totalSize})`;
      });
      spinner.succeed(`${messages.files.uploading} 100% (${totalSize} / ${totalSize})`);
    } catch (error) {
      spinner.fail("File upload failed");
      throw error;
    }
  }

  /**
   * List all files for the authenticated user
   */
  async listFiles(): Promise<void> {
    if (!storageService.hasToken()) {
      MessageUtils.warning(messages.auth.needsLogin);
      return;
    }

    const files = await this.fetchFilesList();
    if (!files.length) {
      return;
    }

    console.log("\n");
    for (const file of files) {
      const size = FileUtils.formatFileSize(file.size);
      console.log(`  ${file.key}  ${size}  ${file.url}`);
    }
    console.log("\n");
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
      if (this.isExpiredAuthError(error)) {
        storageService.clearToken();
        MessageUtils.warning("Stored login expired. Please run `upload-it login` and try again.");
        process.exit(1);
      }
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
      if (this.isExpiredAuthError(error)) {
        storageService.clearToken();
        MessageUtils.warning("Stored login expired. Please run `upload-it login` and try again.");
        return false;
      }
      MessageUtils.errorWithLabel("Delete Error", (error as Error).message);
      return false;
    }
  }

  private isExpiredAuthError(error: unknown): boolean {
    return error instanceof Error && error.message === "Stored authentication expired";
  }
}

export const fileService = new FileService(); 
