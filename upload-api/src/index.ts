import authRouter from "@/routes/auth.route";
import filesRouter from "@/routes/files.route";
import { factory } from "@/lib/factory";

const app = factory.createApp();

app.route("/auth", authRouter);
app.route("/files", filesRouter);

export default app;
