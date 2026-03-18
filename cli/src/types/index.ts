export interface FileItem {
  key: string;
  lastModified: string;
  size: number;
  url: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface AuthResponse {
  token: string;
  isValid: boolean;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  key: string;
}

export interface ListFilesResponse {
  files: Array<{
    key: string;
    lastModified: string;
    size: number;
  }>;
} 