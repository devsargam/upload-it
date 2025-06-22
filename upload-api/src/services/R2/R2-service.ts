import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Context } from "hono";
import type { AppEnv } from '@/types/app';
import { config } from '@/lib/config';

export function createR2Client(c: Context<AppEnv>) {
  return new S3Client({
    region: "auto",
    endpoint: c.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function generatePresignedUrl(client: S3Client, key: string, expiresIn: number = 3600) {
  return await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: config.r2.bucketName, Key: key }),
    { expiresIn },
  );
}

export async function listFiles(client: S3Client) {
  const command = new ListObjectsV2Command({
    Bucket: config.r2.bucketName,
  });
  const { Contents } = await client.send(command);
  return Contents ? Contents.map(file => ({ 
    key: file.Key, 
    lastModified: file.LastModified, 
    size: file.Size 
  })) : [];
}

export async function deleteFile(client: S3Client, key: string) {
  const command = new DeleteObjectCommand({
    Bucket: config.r2.bucketName,
    Key: key,
  });
  await client.send(command);
} 