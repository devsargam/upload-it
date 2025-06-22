import { Hono } from "hono";
import { confirmEmail, verifyEmail } from "@/controllers/auth.controller";

const authRouter = new Hono();

authRouter.post('/confirm-email', ...confirmEmail);
authRouter.post('/verify-email', ...verifyEmail);

export default authRouter;