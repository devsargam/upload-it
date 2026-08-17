import { RTCPeerConnection } from "node-datachannel/polyfill";
import type { RTCDataChannel } from "node-datachannel/polyfill";
import { cleanup } from "node-datachannel";
import { config } from "../config.js";
import { SignalChannel, SignalMessage } from "./signal.service.js";

const HANDSHAKE_TIMEOUT_MS = 60 * 1000;

/**
 * The data channel plus the teardown it needs. libdatachannel holds native
 * handles that keep the event loop alive, so the process hangs without close().
 */
export type PeerSession = {
  dataChannel: RTCDataChannel;
  close: () => void;
};

function toSession(dataChannel: RTCDataChannel, peer: RTCPeerConnection): PeerSession {
  return {
    dataChannel,
    close: () => {
      dataChannel.close();
      peer.close();
      cleanup();
    },
  };
}

/**
 * Wires a peer connection to the signalling room. ICE candidates that arrive
 * before the remote description is set are queued — WebRTC rejects them
 * otherwise, and trickled candidates routinely beat the answer.
 */
function createPeer(channel: SignalChannel) {
  const peer = new RTCPeerConnection({ iceServers: config.iceServers });
  const pendingCandidates: RTCIceCandidateInit[] = [];
  let remoteReady = false;

  peer.onicecandidate = ({ candidate }) => {
    if (candidate) {
      channel.send({ type: "ice", candidate: candidate.candidate, sdpMid: candidate.sdpMid });
    }
  };

  const addCandidate = async (message: Extract<SignalMessage, { type: "ice" }>) => {
    const candidate = { candidate: message.candidate, sdpMid: message.sdpMid ?? undefined };
    if (remoteReady) {
      await peer.addIceCandidate(candidate);
    } else {
      pendingCandidates.push(candidate);
    }
  };

  const setRemote = async (description: RTCSessionDescriptionInit) => {
    await peer.setRemoteDescription(description);
    remoteReady = true;
    for (const candidate of pendingCandidates.splice(0)) {
      await peer.addIceCandidate(candidate);
    }
  };

  return { peer, addCandidate, setRemote };
}

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), HANDSHAKE_TIMEOUT_MS)),
  ]);
}

/**
 * Waits for a receiver to join, then offers a data channel.
 */
export function openSenderChannel(channel: SignalChannel): Promise<PeerSession> {
  const { peer, addCandidate, setRemote } = createPeer(channel);
  const dataChannel = peer.createDataChannel("file");

  const opened = new Promise<PeerSession>((resolve, reject) => {
    dataChannel.onopen = () => resolve(toSession(dataChannel, peer));
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed") {
        reject(new Error("Could not reach the other peer. A restrictive network may be blocking the connection."));
      }
    };

    channel.onMessage(async (message) => {
      try {
        // The room does not buffer, so the offer waits until a peer is present.
        if (message.type === "ready") {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          channel.send({ type: "offer", sdp: offer.sdp! });
        } else if (message.type === "answer") {
          await setRemote({ type: "answer", sdp: message.sdp });
        } else if (message.type === "ice") {
          await addCandidate(message);
        }
      } catch (error) {
        reject(error as Error);
      }
    });
  });

  return withTimeout(opened, "Timed out waiting for the other side to connect.");
}

/**
 * Announces itself to the room and answers the sender's offer.
 */
export function openReceiverChannel(channel: SignalChannel): Promise<PeerSession> {
  const { peer, addCandidate, setRemote } = createPeer(channel);

  const opened = new Promise<PeerSession>((resolve, reject) => {
    peer.ondatachannel = ({ channel: dataChannel }) => {
      dataChannel.onopen = () => resolve(toSession(dataChannel, peer));
      if (dataChannel.readyState === "open") {
        resolve(toSession(dataChannel, peer));
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed") {
        reject(new Error("Could not reach the other peer. A restrictive network may be blocking the connection."));
      }
    };

    channel.onMessage(async (message) => {
      try {
        if (message.type === "offer") {
          await setRemote({ type: "offer", sdp: message.sdp });
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          channel.send({ type: "answer", sdp: answer.sdp! });
        } else if (message.type === "ice") {
          await addCandidate(message);
        }
      } catch (error) {
        reject(error as Error);
      }
    });

    channel.send({ type: "ready" });
  });

  return withTimeout(opened, "Timed out waiting for the sender.");
}
