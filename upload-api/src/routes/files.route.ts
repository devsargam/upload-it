import { Hono } from "hono";
import { presignedUrlHandler, listFilesHandler, deleteFileHandler, anonPresignedUrlHandler, multipartCreateHandler, multipartCompleteHandler, anonMultipartCreateHandler, anonMultipartCompleteHandler } from "@/controllers/files.controller";
import { jwtMiddleware } from "@/middleware";

const filesRouter = new Hono();

// Anonymous upload — no auth
filesRouter.post('/anon/presigned-url', ...anonPresignedUrlHandler);
filesRouter.post('/anon/multipart/create', ...anonMultipartCreateHandler);
filesRouter.post('/anon/multipart/complete', ...anonMultipartCompleteHandler);

// Authenticated routes
filesRouter.use('/presigned-url', jwtMiddleware);
filesRouter.use('/multipart/*', jwtMiddleware);
filesRouter.use('/list-files', jwtMiddleware);
filesRouter.use('/delete-file/*', jwtMiddleware);

filesRouter.post('/presigned-url', ...presignedUrlHandler);
filesRouter.post('/multipart/create', ...multipartCreateHandler);
filesRouter.post('/multipart/complete', ...multipartCompleteHandler);
filesRouter.get('/list-files', ...listFilesHandler);
filesRouter.delete('/delete-file/:key', ...deleteFileHandler);

export default filesRouter;
