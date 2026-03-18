import { factory } from "@/lib/factory";
import { jwt } from "hono/jwt";
import { AppEnv } from "@/types/app";
import { Context, Next } from "hono";

export const jwtMiddleware = factory.createMiddleware(async (c: Context<AppEnv>, next: Next) => {
  const middleware = jwt({ secret: c.env.JWT_SECRET });
  return middleware(c, next);
});
