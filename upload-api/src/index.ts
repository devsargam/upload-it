import authRouter from "@/routes/auth.route";
import filesRouter from "@/routes/files.route";
import signalRouter from "@/routes/signal.route";
import { factory } from "@/lib/factory";
import { cleanup } from "@/services/R2/cleanup";
import { AppEnv } from "@/types/app";
import { cors } from "hono/cors";

export { SignalingRoom } from "@/durable-objects/signaling-room";

// The browser receiver calls this API from the web app's origin.
const ALLOWED_ORIGINS = [
  "https://uploadit.app",
  "https://www.uploadit.app",
  "http://localhost:5173",
];

const app = factory.createApp();

app.use("*", cors({ origin: ALLOWED_ORIGINS }));

app.route("/auth", authRouter);
app.route("/files", filesRouter);
app.route("/signal", signalRouter);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: AppEnv['Bindings'], _ctx: ExecutionContext) {
    await cleanup(env);
  },
};
