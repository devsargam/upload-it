import { Hono, Context } from "hono";
import authenticator from 'authenticator';
import { config } from "./config";
import { jwt, sign } from 'hono/jwt';
import {
  S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendConfirmationMail } from "./services/resend/send-mail";

type AppBindings = { R2_ENDPOINT: string, R2_ACCESS_KEY_ID: string, R2_SECRET_ACCESS_KEY: string };

const app = new Hono<{ Bindings: AppBindings }>();

function createS3Client(c: Context<{ Bindings: AppBindings }>) {
  return new S3Client({
    region: "auto",
    endpoint: c.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

app.post("/confirm", async (c) => {
  const { email } = await c.req.json();
  const formattedToken = authenticator.generateToken(config.secret + email);

  try {
    await sendConfirmationMail({ email, otp: formattedToken });
    return c.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return c.json({ success: false, message: "Failed to send OTP" }, 500);
  }
});

app.post("/verify-email", async (c) => {
  const { email, otp } = await c.req.json();
  const isValid = authenticator.verifyToken(config.secret + email, otp);
  if (!isValid) {
    return c.json({ isValid: false }, 400)
  }

  const token = await sign({
    payload: {
      email,
    }
  }, config.secret);

  return c.json({ isValid: true, token })
});

app.post("/presigned-url", jwt({ secret: config.secret }), async (c) => {
  const client = createS3Client(c);

  const { key } = await c.req.json();
  const presignedUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: "upload-it", Key: key }),
    { expiresIn: 3600 },
  );

  return c.json({ presignedUrl })
});

app.get("/files", jwt({ secret: config.secret }), async (c) => {
  const client = createS3Client(c);

  try {
    const command = new ListObjectsV2Command({
      Bucket: "upload-it",
    });
    const { Contents } = await client.send(command);
    const files = Contents ? Contents.map(file => ({ key: file.Key, lastModified: file.LastModified, size: file.Size })) : [];
    return c.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    return c.json({ success: false, message: "Failed to list files" }, 500);
  }
});

app.delete("/file/:key", jwt({ secret: config.secret }), async (c) => {
  const client = createS3Client(c);

  const key = c.req.param('key');

  try {
    const command = new DeleteObjectCommand({
      Bucket: "upload-it",
      Key: key,
    });
    await client.send(command);
    return c.json({ success: true, message: `File '${key}' deleted successfully.` });
  } catch (error) {
    console.error(`Error deleting file '${key}':`, error);
    return c.json({ success: false, message: `Failed to delete file '${key}'.` }, 500);
  }
});

export default app;
