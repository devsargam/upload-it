import { S3Client as R2Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CONFIG } from '@/lib/config';
import { Context } from 'hono';
import { AppEnv } from '@/types/app';

export function createR2Client(c: Context<AppEnv>) {
  return new R2Client({
    region: "auto",
    endpoint: c.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function generatePresignedUrl(client: R2Client, key: string, c: Context<AppEnv>, expiresIn: number = 3600) {
  return await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: c.env.R2_BUCKET_NAME, Key: key }),
    { expiresIn },
  );
}

export async function listFiles(client: R2Client, c: Context<AppEnv>) {
  const command = new ListObjectsV2Command({
    Bucket: c.env.R2_BUCKET_NAME,
  });
  const { Contents } = await client.send(command);
  return Contents ? Contents.map(file => ({ 
    key: file.Key, 
    lastModified: file.LastModified, 
    size: file.Size 
  })) : [];
}

export async function deleteFile(client: R2Client, key: string, c: Context<AppEnv>) {
  const command = new DeleteObjectCommand({
    Bucket: c.env.R2_BUCKET_NAME,
    Key: key,
  });
  await client.send(command);
} 