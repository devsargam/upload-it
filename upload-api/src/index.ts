import { Hono } from "hono";
import authenticator from 'authenticator';
import { config } from "./config";
import { jwt, sign } from 'hono/jwt';
import {
  S3Client, GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = new Hono<{ Bindings: { R2_ENDPOINT: string, R2_ACCESS_KEY_ID: string, R2_SECRET_ACCESS_KEY: string } }>();

app.post("/confirm", async (c) => {
  const { email } = await c.req.json();
  const formattedToken = authenticator.generateToken(config.secret + email);

  return c.json({ otp: formattedToken })
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
  const client = new S3Client({
    region: "auto",
    endpoint: c.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    }
  });

  const { key } = await c.req.json();
  const presignedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: "upload-it", Key: key }),
    { expiresIn: 3600 },
  );

  return c.json({ presignedUrl })
});

export default app;
