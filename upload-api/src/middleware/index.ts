import { factory } from "@/lib/factory";
import { jwt } from "hono/jwt";
import { CONFIG } from "@/lib/config";

export const jwtMiddleware = factory.createMiddleware(jwt({ secret: CONFIG.SECRET }));  