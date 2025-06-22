import { Hono } from "hono";
import { presignedUrlHandler, listFilesHandler, deleteFileHandler } from "@/controllers/files.controller";
import { jwtMiddleware } from "@/middleware";

const filesRouter = new Hono();

filesRouter.use('*', jwtMiddleware);
filesRouter.post('/presigned-url', ...presignedUrlHandler);
filesRouter.get('/list-files', ...listFilesHandler);
filesRouter.delete('/delete-file/:key', ...deleteFileHandler);

export default filesRouter;
