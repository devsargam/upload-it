import { factory } from "@/lib/factory";
import { jwt } from "hono/jwt";
import { config } from "@/lib/config";

export const jwtMiddleware = factory.createMiddleware(jwt({ secret: config.secret }));