import { S3Client as R2Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

export function createR2ClientFromEnv(env: AppEnv['Bindings']) {
  return new R2Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function generatePresignedUrl(
  client: R2Client,
  key: string,
  c: Context<AppEnv>,
  metadata?: Record<string, string>,
  expiresIn: number = 3600,
) {
  return await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: c.env.R2_BUCKET_NAME,
      Key: key,
      Metadata: metadata,
    }),
    { expiresIn },
  );
}

export async function createMultipartUpload(
  client: R2Client,
  key: string,
  c: Context<AppEnv>,
  metadata?: Record<string, string>,
) {
  const { UploadId } = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: c.env.R2_BUCKET_NAME,
      Key: key,
      Metadata: metadata,
    }),
  );
  return UploadId!;
}

export async function generatePartUrls(
  client: R2Client,
  key: string,
  uploadId: string,
  partCount: number,
  c: Context<AppEnv>,
  expiresIn: number = 21600,
) {
  const urls: string[] = [];
  for (let partNumber = 1; partNumber <= partCount; partNumber++) {
    const url = await getSignedUrl(
      client,
      new UploadPartCommand({
        Bucket: c.env.R2_BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      }),
      { expiresIn },
    );
    urls.push(url);
  }
  return urls;
}

export async function completeMultipartUpload(
  client: R2Client,
  key: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[],
  c: Context<AppEnv>,
) {
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: c.env.R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map(part => ({ PartNumber: part.partNumber, ETag: part.etag })),
      },
    }),
  );
}

export async function listFiles(client: R2Client, c: Context<AppEnv>, prefix?: string) {
  const command = new ListObjectsV2Command({
    Bucket: c.env.R2_BUCKET_NAME,
    Prefix: prefix,
  });
  const { Contents } = await client.send(command);
  return Contents ? Contents.map(file => ({
    key: file.Key!.replace(prefix || '', ''),
    lastModified: file.LastModified,
    size: file.Size
  })) : [];
}

export async function listAllFiles(client: R2Client, bucket: string) {
  const allFiles: { key: string; lastModified?: Date }[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    });
    const response = await client.send(command);
    if (response.Contents) {
      for (const file of response.Contents) {
        allFiles.push({ key: file.Key!, lastModified: file.LastModified });
      }
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return allFiles;
}

export async function getFileMetadata(client: R2Client, bucket: string, key: string) {
  const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
  const response = await client.send(command);
  return response.Metadata;
}

export async function deleteFile(client: R2Client, key: string, c: Context<AppEnv>) {
  const command = new DeleteObjectCommand({
    Bucket: c.env.R2_BUCKET_NAME,
    Key: key,
  });
  await client.send(command);
}

export async function deleteFileByKey(client: R2Client, bucket: string, key: string) {
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  await client.send(command);
}
