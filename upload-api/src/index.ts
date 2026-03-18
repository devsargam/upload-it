import authRouter from "@/routes/auth.route";
import filesRouter from "@/routes/files.route";
import { factory } from "@/lib/factory";
import { cleanup } from "@/services/R2/cleanup";
import { AppEnv } from "@/types/app";

const app = factory.createApp();

app.route("/auth", authRouter);
app.route("/files", filesRouter);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: AppEnv['Bindings'], _ctx: ExecutionContext) {
    await cleanup(env);
  },
};
