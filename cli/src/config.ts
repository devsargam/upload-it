export const config = {
  API_URL: "https://upload-api.hp424805.workers.dev",
  BASE_FILE_URL: "https://uploadit.theharsh.xyz/",
  endpoints: {  
    confirm: "/auth/confirm-email",
    verifyEmail: "/auth/verify-email",
    presignedUrl: "/files/presigned-url",
    listFiles: "/files/list-files",
    deleteFile: "/files/delete-file"
  }
}; 