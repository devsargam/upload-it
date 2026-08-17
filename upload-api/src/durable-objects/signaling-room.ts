import { DurableObject } from "cloudflare:workers";

// A room is single-use and short-lived: the sender waits here for a receiver,
// they swap SDP and ICE, then connect directly and the room is thrown away.
const ROOM_TTL_MS = 15 * 60 * 1000;
const MAX_PEERS = 2;

export class SignalingRoom extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a websocket upgrade", { status: 426 });
    }
    if (this.ctx.getWebSockets().length >= MAX_PEERS) {
      return new Response("Room is full", { status: 409 });
    }

    const [client, server] = Object.values(new WebSocketPair());

    // Hibernation: the room idles while the sender waits, so keep no state in
    // memory. acceptWebSocket lets the object evict and wake on the next message.
    this.ctx.acceptWebSocket(server);
    await this.ctx.storage.setAlarm(Date.now() + ROOM_TTL_MS);

    return new Response(null, { status: 101, webSocket: client });
  }

  // Signalling payloads are opaque here — the worker only forwards them.
  async webSocketMessage(sender: WebSocket, message: string | ArrayBuffer) {
    for (const peer of this.ctx.getWebSockets()) {
      if (peer !== sender) {
        peer.send(message);
      }
    }
  }

  async webSocketClose(closing: WebSocket) {
    for (const peer of this.ctx.getWebSockets()) {
      if (peer !== closing) {
        peer.close(1000, "Peer disconnected");
      }
    }
    await this.ctx.storage.deleteAll();
  }

  async alarm() {
    for (const peer of this.ctx.getWebSockets()) {
      peer.close(1000, "Room expired");
    }
    await this.ctx.storage.deleteAll();
  }
}
