import axios, { AxiosError } from "axios";
import { createReadStream } from "fs";
import { config } from "../config.js";
import { AuthResponse, PresignedUrlResponse, ListFilesResponse, ApiResponse } from "../types/index.js";

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
      throw new Error(`Failed to get upload URL: ${(error as AxiosError).message}`);
    }
  }

  static async uploadFile(presignedUrl: string, filePath: string, fileSize: number): Promise<void> {
    try {
      await axios.put(presignedUrl, createReadStream(filePath), {
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
      throw new Error(`Failed to delete file: ${(error as AxiosError).message}`);
    }
  }
} 