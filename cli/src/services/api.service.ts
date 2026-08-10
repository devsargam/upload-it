import axios, { AxiosError } from "axios";
import { createReadStream } from "fs";
import { config } from "../config.js";
import { AuthResponse, PresignedUrlResponse, ListFilesResponse, ApiResponse } from "../types/index.js";

function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export class ApiService {
  private static baseUrl = config.API_URL;

  // Auth-related API calls
  static async sendVerificationCode(email: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}${config.endpoints.confirm}`, { email });
    } catch (error) {
      throw new Error(`Failed to send verification code: ${(error as AxiosError).message}`);
    }
  }

  static async verifyEmail(email: string, otp: string): Promise<AuthResponse> {
    try {
      const { data } = await axios.post<AuthResponse>(
        `${this.baseUrl}${config.endpoints.verifyEmail}`,
        { email, otp }
      );
      return data;
    } catch (error) {
      throw new Error(`Email verification failed: ${(error as AxiosError).message}`);
    }
  }

  // File-related API calls
  static async getPresignedUrl(fileName: string, token: string): Promise<PresignedUrlResponse> {
    try {
      const { data } = await axios.post<PresignedUrlResponse>(
        `${this.baseUrl}${config.endpoints.presignedUrl}`,
        { key: fileName },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return data;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        throw new Error("Stored authentication expired");
      }
      throw new Error(`Failed to get upload URL: ${(error as AxiosError).message}`);
    }
  }

  static async getAnonPresignedUrl(fileName: string): Promise<PresignedUrlResponse> {
    try {
      const { data } = await axios.post<PresignedUrlResponse>(
        `${this.baseUrl}${config.endpoints.anonPresignedUrl}`,
        { key: fileName }
      );
      return data;
    } catch (error) {
      throw new Error(`Failed to get upload URL: ${(error as AxiosError).message}`);
    }
  }

  static async uploadFile(
    presignedUrl: string,
    filePath: string,
    fileSize: number,
    onProgress?: (bytesUploaded: number) => void
  ): Promise<void> {
    try {
      const fileStream = createReadStream(filePath);
      if (onProgress) {
        let bytesUploaded = 0;
        fileStream.on("data", (chunk) => {
          bytesUploaded += chunk.length;
          onProgress(bytesUploaded);
        });
      }
      await axios.put(presignedUrl, fileStream, {
        headers: {
          "Content-Length": fileSize,
          "Content-Type": "application/octet-stream",
        },
      });
    } catch (error) {
      throw new Error(`File upload failed: ${(error as AxiosError).message}`);
    }
  }

  static async listFiles(token: string): Promise<ListFilesResponse> {
    try {
      const { data } = await axios.get<ListFilesResponse>(
        `${this.baseUrl}${config.endpoints.listFiles}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return data;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        throw new Error("Stored authentication expired");
      }
      throw new Error(`Failed to fetch file list: ${(error as AxiosError).message}`);
    }
  }

  static async deleteFile(fileName: string, token: string): Promise<ApiResponse> {
    try {
      const { data } = await axios.delete<ApiResponse>(
        `${this.baseUrl}${config.endpoints.deleteFile}/${fileName}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return data;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        throw new Error("Stored authentication expired");
      }
      throw new Error(`Failed to delete file: ${(error as AxiosError).message}`);
    }
  }
}
