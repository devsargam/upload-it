import { Hono } from "hono";

const app = new Hono();

app.post("/confirm", (c) => {
  return c.text("Hello Email!");
});

app.post("/verify-email", (c) => {
  return c.text("Hello Verify Email!");
});

app.post("/presigned-url", (c) => {
  return c.text("Hello Presigned URL!");
});

export default app;
