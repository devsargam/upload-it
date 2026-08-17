const API_URL = "https://upload-api.sargam.workers.dev";
const SIGNAL_ROOM = "/signal/room";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type SignalMessage =
  | { type: "ready" }
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "ice"; candidate: string; sdpMid: string | null };

type FileMeta = { name: string; size: number };

export type ReceiveHandlers = {
  onStatus: (status: string) => void;
  onProgress: (received: number, total: number) => void;
};

export type ReceivedFile = { blob: Blob; name: string };

/**
 * Browser half of the CLI's `send` command: joins the signalling room, answers
 * the sender's offer, then pulls the file over a data channel.
 */
export function receiveFile(roomId: string, handlers: ReceiveHandlers): Promise<ReceivedFile> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${API_URL.replace(/^http/, "ws")}${SIGNAL_ROOM}/${roomId}`);
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Candidates can arrive before the remote description is set, and WebRTC
    // rejects them until it is — so hold them until the offer is applied.
    const pending: RTCIceCandidateInit[] = [];
    let remoteReady = false;

    const chunks: ArrayBuffer[] = [];
    let meta: FileMeta | undefined;
    let received = 0;

    const fail = (message: string) => {
      socket.close();
      peer.close();
      reject(new Error(message));
    };

    const send = (message: SignalMessage) => socket.send(JSON.stringify(message));

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        send({ type: "ice", candidate: candidate.candidate, sdpMid: candidate.sdpMid });
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed") {
        fail("Could not reach the sender. A restrictive network may be blocking the connection.");
      }
    };

    peer.ondatachannel = ({ channel }) => {
      channel.binaryType = "arraybuffer";
      handlers.onStatus("Connected. Receiving...");

      channel.onmessage = ({ data }) => {
        // The sender always leads with a metadata header.
        if (!meta) {
          meta = JSON.parse(String(data)) as FileMeta;
          handlers.onProgress(0, meta.size);
          return;
        }

        chunks.push(data as ArrayBuffer);
        received += (data as ArrayBuffer).byteLength;
        handlers.onProgress(received, meta.size);

        if (received >= meta.size) {
          channel.send("done");
          socket.close();
          peer.close();
          resolve({ blob: new Blob(chunks), name: meta.name });
        }
      };
    };

    socket.onopen = () => {
      handlers.onStatus("Waiting for the sender...");
      send({ type: "ready" });
    };

    socket.onerror = () => fail("Could not join the room. The link may be wrong, full or expired.");

    socket.onmessage = async (event) => {
      const message = JSON.parse(String(event.data)) as SignalMessage;
      try {
        if (message.type === "offer") {
          await peer.setRemoteDescription({ type: "offer", sdp: message.sdp });
          remoteReady = true;
          for (const candidate of pending.splice(0)) {
            await peer.addIceCandidate(candidate);
          }
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          send({ type: "answer", sdp: answer.sdp! });
        } else if (message.type === "ice") {
          const candidate = { candidate: message.candidate, sdpMid: message.sdpMid ?? undefined };
          if (remoteReady) {
            await peer.addIceCandidate(candidate);
          } else {
            pending.push(candidate);
          }
        }
      } catch (error) {
        fail((error as Error).message);
      }
    };
  });
}

/** Hands the assembled file to the browser's downloader. */
export function saveFile({ blob, name }: ReceivedFile): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
