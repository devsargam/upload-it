import { Hono } from "hono";
import { createRoomHandler, joinRoomHandler } from "@/controllers/signal.controller";

const signalRouter = new Hono();

// Peer-to-peer transfer is anonymous — nothing is stored, so no auth.
signalRouter.post('/room', ...createRoomHandler);
signalRouter.get('/room/:roomId', ...joinRoomHandler);

export default signalRouter;
