export const config = {
  API_URL: "https://upload-api.sargam.workers.dev",
  BASE_FILE_URL: "https://storage.uploadit.app/",
  endpoints: {  
    confirm: "/auth/confirm-email",
    verifyEmail: "/auth/verify-email",
    presignedUrl: "/files/presigned-url",
    anonPresignedUrl: "/files/anon/presigned-url",
    listFiles: "/files/list-files",
    deleteFile: "/files/delete-file"
  }
}; 