export const config = {
  API_URL: "http://localhost:8787",
  BASE_FILE_URL: "https://uploadit.theharsh.xyz/",
  endpoints: {  
    confirm: "/auth/confirm-email",
    verifyEmail: "/auth/verify-email",
    presignedUrl: "/files/presigned-url",
    listFiles: "/files/list-files",
    deleteFile: "/files/delete-file"
  }
}; 