import Conf from "conf";
import { MessageUtils } from "../utils/messages.js";

interface StorageData {
  token: string;
}

/**
 * Service for managing persistent storage of application data
 */
export class StorageService {
  private store: Conf<StorageData>;
  private readonly projectName = "upload-it";

  constructor() {
    this.store = new Conf<StorageData>({ projectName: this.projectName });
  }

  /**
   * Check if a token exists in storage
   */
  hasToken(): boolean {
    try {
      return this.store.has("token");
    } catch (error) {
      this.handleStorageError("checking token existence", error as Error);
      return false;
    }
  }

  /**
   * Retrieve the stored token
   */
  getToken(): string | undefined {
    try {
      return this.store.get("token");
    } catch (error) {
      this.handleStorageError("retrieving token", error as Error);
      return undefined;
    }
  }

  /**
   * Store a new token
   */
  setToken(token: string): boolean {
    try {
      if (!token || token.trim() === "") {
        MessageUtils.error("Cannot store empty token");
        return false;
      }
      
      this.store.set("token", token);
      return true;
    } catch (error) {
      this.handleStorageError("storing token", error as Error);
      return false;
    }
  }

  /**
   * Clear the stored token
   */
  clearToken(): boolean {
    try {
      this.store.clear();
      return true;
    } catch (error) {
      this.handleStorageError("clearing token", error as Error);
      return false;
    }
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  /**
   * Get storage file path for debugging purposes
   */
  getStoragePath(): string {
    return this.store.path;
  }

  /**
   * Handle storage operation errors
   */
  private handleStorageError(operation: string, error: Error): void {
    MessageUtils.errorWithLabel("Storage Error", `Failed ${operation}: ${error.message}`);
  }
}

export const storageService = new StorageService(); 