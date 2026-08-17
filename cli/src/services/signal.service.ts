import { config } from "../config.js";

export type SignalMessage =
  | { type: "ready" }
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "ice"; candidate: string; sdpMid: string | null };

/**
 * Thin wrapper over the signalling room websocket. It only carries the
 * handshake — once the peers connect directly, the room is closed.
 */
export class SignalChannel {
  private constructor(private readonly socket: WebSocket) {}

  static async createRoom(): Promise<string> {
    const response = await fetch(`${config.API_URL}${config.endpoints.signalRoom}`, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Could not create a room (${response.status})`);
    }
    const { roomId } = (await response.json()) as { roomId: string };
    return roomId;
  }

  static async join(roomId: string): Promise<SignalChannel> {
    const base = config.API_URL.replace(/^http/, "ws");
    const socket = new WebSocket(`${base}${config.endpoints.signalRoom}/${roomId}`);

    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve();
      socket.onerror = () => reject(new Error("Could not join the room. The code may be wrong, full or expired."));
    });

    return new SignalChannel(socket);
  }

  send(message: SignalMessage): void {
    this.socket.send(JSON.stringify(message));
  }

  onMessage(handler: (message: SignalMessage) => void): void {
    this.socket.onmessage = (event) => handler(JSON.parse(String(event.data)) as SignalMessage);
  }

  close(): void {
    this.socket.close();
  }
}
