import { createReadStream, createWriteStream } from "node:fs";
import { basename, resolve } from "node:path";
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
 * and resolves once the receiver acknowledges the whole thing.
 */
export async function sendFile(
  channel: RTCDataChannel,
  filePath: string,
  meta: FileMeta,
  onProgress: ProgressHandler
): Promise<void> {
  const acknowledged = new Promise<void>((res) => {
    channel.onmessage = ({ data }) => {
      if (String(data) === "done") {
        res();
      }
    };
  });

  channel.send(JSON.stringify(meta));

  let sent = 0;
  for await (const chunk of createReadStream(filePath, { highWaterMark: CHUNK_SIZE })) {
    await drain(channel);
    channel.send(chunk as Buffer);
    sent += (chunk as Buffer).length;
    onProgress(sent, meta.size);
  }

  await acknowledged;
}

/**
 * Mirrors sendFile: reads metadata, writes chunks to disk, then acknowledges.
 */
export function receiveFile(
  channel: RTCDataChannel,
  targetDir: string,
  onProgress: ProgressHandler
): Promise<{ path: string; meta: FileMeta }> {
  return new Promise((res, rej) => {
    let meta: FileMeta | undefined;
    let target: string;
    let stream: ReturnType<typeof createWriteStream>;
    let written = 0;

    channel.onmessage = ({ data }) => {
      // The first message is always the metadata header.
      if (!meta) {
        meta = JSON.parse(String(data)) as FileMeta;
        // basename keeps a hostile sender from writing outside targetDir.
        target = resolve(targetDir, basename(meta.name));
        stream = createWriteStream(target);
        stream.on("error", rej);
        return;
      }

      const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      stream.write(chunk);
      written += chunk.length;
      onProgress(written, meta.size);

      if (written >= meta.size) {
        stream.end(() => {
          channel.send("done");
          res({ path: target, meta: meta as FileMeta });
        });
      }
    };

    channel.onclose = () => {
      if (!meta || written < meta.size) {
        rej(new Error("The sender disconnected before the transfer finished."));
      }
    };
  });
}
