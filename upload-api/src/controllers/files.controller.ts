import { factory } from '@/lib/factory';
import { createR2Client, generatePresignedUrl, listFiles, deleteFile, createMultipartUpload, generatePartUrls, completeMultipartUpload } from '@/services/R2/R2-service';
import { Context } from 'hono';

const ANON_EXPIRY_HOURS = 24;
const AUTH_EXPIRY_DAYS = 7;
const MAX_PARTS = 1000;

function generateId(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  const timestamp = Date.now().toString(36);
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${timestamp}${random}`;
}

async function hashEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(email);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getUserEmail(c: Context): string {
  const payload = c.get('jwtPayload');
  return payload.payload.email;
}

function getExpiresAt(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function normalizeKey(key: string): string {
  return key.replace(/\s+/g, '-');
}

// Anonymous upload — no auth required
export const anonPresignedUrlHandler = factory.createHandlers(async (c: Context) => {
  const client = createR2Client(c);
  const { key: rawKey } = await c.req.json();
  const key = normalizeKey(rawKey);
  const id = generateId();
  const r2Key = `anon/${id}/${key}`;

  try {
    const presignedUrl = await generatePresignedUrl(client, r2Key, c, {
      type: 'anon',
      expires_at: getExpiresAt(ANON_EXPIRY_HOURS),
    });
    return c.json({ presignedUrl, key: r2Key });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return c.json({ success: false, message: "Failed to generate presigned URL" }, 500);
  }
})

// Authenticated upload
export const presignedUrlHandler = factory.createHandlers(async (c: Context) => {
  const client = createR2Client(c);
  const { key: rawKey } = await c.req.json();
  const key = normalizeKey(rawKey);
  const email = getUserEmail(c);
  const userId = await hashEmail(email);
  const r2Key = `${userId}/${key}`;

  try {
    const presignedUrl = await generatePresignedUrl(client, r2Key, c, {
      type: 'auth',
      expires_at: getExpiresAt(AUTH_EXPIRY_DAYS * 24),
    });
    return c.json({ presignedUrl, key: r2Key });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return c.json({ success: false, message: "Failed to generate presigned URL" }, 500);
  }
})

function isValidPartCount(partCount: unknown): partCount is number {
  return Number.isInteger(partCount) && (partCount as number) >= 1 && (partCount as number) <= MAX_PARTS;
}

function isValidPartsList(parts: unknown): parts is { partNumber: number; etag: string }[] {
  return Array.isArray(parts)
    && parts.length > 0
    && parts.every(part => Number.isInteger(part?.partNumber) && typeof part?.etag === 'string');
}

// Anonymous multipart upload — no auth required
export const anonMultipartCreateHandler = factory.createHandlers(async (c: Context) => {
  const client = createR2Client(c);
  const { key: rawKey, partCount } = await c.req.json();
  if (!isValidPartCount(partCount)) {
    return c.json({ success: false, message: `partCount must be an integer between 1 and ${MAX_PARTS}` }, 400);
  }
  const key = normalizeKey(rawKey);
  const id = generateId();
  const r2Key = `anon/${id}/${key}`;

  try {
    const uploadId = await createMultipartUpload(client, r2Key, c, {
      type: 'anon',
      expires_at: getExpiresAt(ANON_EXPIRY_HOURS),
    });
    const partUrls = await generatePartUrls(client, r2Key, uploadId, partCount, c);
    return c.json({ uploadId, key: r2Key, partUrls });
  } catch (error) {
    console.error('Error creating multipart upload:', error);
    return c.json({ success: false, message: "Failed to create multipart upload" }, 500);
  }
})

// Authenticated multipart upload
export const multipartCreateHandler = factory.createHandlers(async (c: Context) => {
  const client = createR2Client(c);
  const { key: rawKey, partCount } = await c.req.json();
  if (!isValidPartCount(partCount)) {
    return c.json({ success: false, message: `partCount must be an integer between 1 and ${MAX_PARTS}` }, 400);
  }
  const key = normalizeKey(rawKey);
  const email = getUserEmail(c);
  const userId = await hashEmail(email);
  const r2Key = `${userId}/${key}`;

  try {
    const uploadId = await createMultipartUpload(client, r2Key, c, {
      type: 'auth',
      expires_at: getExpiresAt(AUTH_EXPIRY_DAYS * 24),
    });
    const partUrls = await generatePartUrls(client, r2Key, uploadId, partCount, c);
    return c.json({ uploadId, key: r2Key, partUrls });
  } catch (error) {
    console.error('Error creating multipart upload:', error);
    return c.json({ success: false, message: "Failed to create multipart upload" }, 500);
  }
})

// Anonymous multipart complete — no auth required
export const anonMultipartCompleteHandler = factory.createHandlers(async (c: Context) => {
  const client = createR2Client(c);
  const { key, uploadId, parts } = await c.req.json();
  if (typeof key !== 'string' || !key.startsWith('anon/') || typeof uploadId !== 'string' || !isValidPartsList(parts)) {
    return c.json({ success: false, message: "Invalid multipart complete request" }, 400);
  }

  try {
    await completeMultipartUpload(client, key, uploadId, parts, c);
    return c.json({ success: true, key });
  } catch (error) {
    console.error('Error completing multipart upload:', error);
    return c.json({ success: false, message: "Failed to complete multipart upload" }, 500);
  }
})

// Authenticated multipart complete
export const multipartCompleteHandler = factory.createHandlers(async (c: Context) => {
  const client = createR2Client(c);
  const { key, uploadId, parts } = await c.req.json();
  const email = getUserEmail(c);
  const userId = await hashEmail(email);
  if (typeof key !== 'string' || !key.startsWith(`${userId}/`) || typeof uploadId !== 'string' || !isValidPartsList(parts)) {
    return c.json({ success: false, message: "Invalid multipart complete request" }, 400);
  }

  try {
    await completeMultipartUpload(client, key, uploadId, parts, c);
    return c.json({ success: true, key });
  } catch (error) {
    console.error('Error completing multipart upload:', error);
    return c.json({ success: false, message: "Failed to complete multipart upload" }, 500);
  }
})

export const listFilesHandler = factory.createHandlers(async (c: Context) => {
  const client = createR2Client(c);
  const email = getUserEmail(c);
  const userId = await hashEmail(email);

  try {
    const files = await listFiles(client, c, `${userId}/`);
    return c.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    return c.json({ success: false, message: "Failed to list files" }, 500);
  }
})

export const deleteFileHandler = factory.createHandlers(async (c: Context) => {
  const client = createR2Client(c);
  const key = c.req.param('key');
  const email = getUserEmail(c);
  const userId = await hashEmail(email);

  try {
    await deleteFile(client, `${userId}/${key}`, c);
    return c.json({ success: true, message: `File '${key}' deleted successfully.` });
  } catch (error) {
    console.error(`Error deleting file '${key}':`, error);
    return c.json({ success: false, message: `Failed to delete file '${key}'.` }, 500);
  }
});
