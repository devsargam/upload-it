import { Hono } from "hono";
import authenticator from 'authenticator';
import { config } from "./config";
import { jwt, sign } from 'hono/jwt';

const app = new Hono();

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
  return c.text("Hello Presigned URL!");
});

export default app;
