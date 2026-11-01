import { createReadStream, createWriteStream } from "node:fs";
import type { RTCDataChannel } from "node-datachannel/polyfill";

const CHUNK_SIZE = 16 * 1024;
const BUFFER_LIMIT = 1024 * 1024;
const BUFFER_LOW = 256 * 1024;

export type FileMeta = { name: string; size: number };
export type ProgressHandler = (bytes: number, total: number) => void;

/** Keeps the send loop from outrunning the network and ballooning memory. */
function drain(channel: RTCDataChannel): Promise<void> {
  if (channel.bufferedAmount < BUFFER_LIMIT) {
    return Promise.resolve();
  }
  return new Promise((res) => {
    channel.bufferedAmountLowThreshold = BUFFER_LOW;
    channel.onbufferedamountlow = () => res();
  });
}

/**
 * Streams a file over the data channel: metadata first, then raw chunks,
 * and resolves once the receiver acknowledges the whole thing (or throws if it cancels).
 */
export async function sendFile(
  channel: RTCDataChannel,
  filePath: string,
  meta: FileMeta,
  onProgress: ProgressHandler
): Promise<void> {
  let cancelled = false;
  const finished = new Promise<void>((res) => {
    channel.onmessage = ({ data }) => {
      cancelled = String(data) === "cancel";
      if (cancelled || String(data) === "done") {
        res();
      }
    };
  });

  channel.send(JSON.stringify(meta));

  let sent = 0;
  for await (const chunk of createReadStream(filePath, { highWaterMark: CHUNK_SIZE })) {
    if (cancelled) {
      break;
    }
    await drain(channel);
    channel.send(chunk as Buffer);
    sent += (chunk as Buffer).length;
    onProgress(sent, meta.size);
  }

  await finished;
  if (cancelled) {
    throw new Error("The receiver cancelled the transfer.");
  }
}

/** Decides where an incoming file is written, or rejects to cancel. */
export type TargetChooser = (meta: FileMeta) => Promise<string>;

/**
 * Mirrors sendFile: reads metadata, writes chunks to disk, then acknowledges.
 * Chunks that arrive while chooseTarget is still deciding are held in memory.
 */
export function receiveFile(
  channel: RTCDataChannel,
  chooseTarget: TargetChooser,
  onProgress: ProgressHandler
): Promise<{ path: string; meta: FileMeta }> {
  return new Promise((res, rej) => {
    let meta: FileMeta | undefined;
    let target: string;
    let stream: ReturnType<typeof createWriteStream> | undefined;
    let pending: Buffer[] = [];
    let written = 0;

    const writeChunk = (chunk: Buffer) => {
      const current = meta as FileMeta;
      stream!.write(chunk);
      written += chunk.length;
      onProgress(written, current.size);

      if (written >= current.size) {
        stream!.end(() => {
          channel.send("done");
          res({ path: target, meta: current });
        });
      }
    };

    const openTarget = async (current: FileMeta) => {
      try {
        target = await chooseTarget(current);
      } catch (error) {
        channel.send("cancel");
        rej(error);
        return;
      }
      stream = createWriteStream(target);
      stream.on("error", rej);
      pending.forEach(writeChunk);
      pending = [];
    };

    channel.onmessage = ({ data }) => {
      // The first message is always the metadata header.
      if (!meta) {
        meta = JSON.parse(String(data)) as FileMeta;
        void openTarget(meta);
        return;
      }

      const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      if (stream) {
        writeChunk(chunk);
      } else {
        pending.push(chunk);
      }
    };

    channel.onclose = () => {
      if (!meta || written < meta.size) {
        rej(new Error("The sender disconnected before the transfer finished."));
      }
    };
  });
}
