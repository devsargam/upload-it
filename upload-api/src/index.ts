import authRouter from "@/routes/auth.route";
import filesRouter from "@/routes/files.route";
import signalRouter from "@/routes/signal.route";
import { factory } from "@/lib/factory";
import { cleanup } from "@/services/R2/cleanup";
import { AppEnv } from "@/types/app";

export { SignalingRoom } from "@/durable-objects/signaling-room";

const app = factory.createApp();

app.route("/auth", authRouter);
app.route("/files", filesRouter);
app.route("/signal", signalRouter);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: AppEnv['Bindings'], _ctx: ExecutionContext) {
    await cleanup(env);
  },
};
