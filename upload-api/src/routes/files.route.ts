import { Hono } from "hono";
import { presignedUrlHandler, listFilesHandler, deleteFileHandler, anonPresignedUrlHandler } from "@/controllers/files.controller";
import { jwtMiddleware } from "@/middleware";

const filesRouter = new Hono();

// Anonymous upload — no auth
filesRouter.post('/anon/presigned-url', ...anonPresignedUrlHandler);

// Authenticated routes
filesRouter.use('/presigned-url', jwtMiddleware);
filesRouter.use('/list-files', jwtMiddleware);
filesRouter.use('/delete-file/*', jwtMiddleware);

filesRouter.post('/presigned-url', ...presignedUrlHandler);
filesRouter.get('/list-files', ...listFilesHandler);
filesRouter.delete('/delete-file/:key', ...deleteFileHandler);

export default filesRouter;
