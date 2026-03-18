import { createR2ClientFromEnv, listAllFiles, getFileMetadata, deleteFileByKey } from './R2-service';
import { AppEnv } from '@/types/app';

export async function cleanup(env: AppEnv['Bindings']) {
  const client = createR2ClientFromEnv(env);
  const bucket = env.R2_BUCKET_NAME;
  const now = new Date();

  const files = await listAllFiles(client, bucket);
  let deleted = 0;

  for (const file of files) {
    try {
      const metadata = await getFileMetadata(client, bucket, file.key);
      if (!metadata?.expires_at) continue;

      const expiresAt = new Date(metadata.expires_at);
      if (now > expiresAt) {
        await deleteFileByKey(client, bucket, file.key);
        deleted++;
        console.log(`Deleted expired file: ${file.key}`);
      }
    } catch (error) {
      console.error(`Error checking file ${file.key}:`, error);
    }
  }

  console.log(`Cleanup complete. Deleted ${deleted} expired files.`);
}
