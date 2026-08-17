export const config = {
  API_URL: "https://upload-api.sargam.workers.dev",
  BASE_FILE_URL: "https://storage.uploadit.app/",
  endpoints: {  
    confirm: "/auth/confirm-email",
    verifyEmail: "/auth/verify-email",
    presignedUrl: "/files/presigned-url",
    anonPresignedUrl: "/files/anon/presigned-url",
    multipartCreate: "/files/multipart/create",
    anonMultipartCreate: "/files/anon/multipart/create",
    multipartComplete: "/files/multipart/complete",
    anonMultipartComplete: "/files/anon/multipart/complete",
    listFiles: "/files/list-files",
    deleteFile: "/files/delete-file",
    signalRoom: "/signal/room"
  },
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
}; 