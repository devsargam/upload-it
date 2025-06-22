import { factory } from '@/lib/factory';
import { createR2Client, generatePresignedUrl, listFiles, deleteFile } from '@/services/R2/R2-service';
import { Context } from 'hono';

export const presignedUrlHandler = factory.createHandlers(async (c: Context) => {
    const client = createR2Client(c);
    const { key } = await c.req.json();
    
    try {
      const presignedUrl = await generatePresignedUrl(client, key);
      return c.json({ presignedUrl });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      return c.json({ success: false, message: "Failed to generate presigned URL" }, 500);
    }
  })

export const listFilesHandler = factory.createHandlers(async (c: Context) => {
    const client = createR2Client(c);

    try {
      const files = await listFiles(client);
      return c.json({ files });
    } catch (error) {
      console.error('Error listing files:', error);
      return c.json({ success: false, message: "Failed to list files" }, 500);
    }
  })

export const deleteFileHandler = factory.createHandlers(async (c: Context) => {
    const client = createR2Client(c);
    const key = c.req.param('key');

    try {
      await deleteFile(client, key);
      return c.json({ success: true, message: `File '${key}' deleted successfully.` });
    } catch (error) {
      console.error(`Error deleting file '${key}':`, error);
      return c.json({ success: false, message: `Failed to delete file '${key}'.` }, 500);
    }
  }); 