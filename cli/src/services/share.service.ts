import { config } from "../config.js";
import { SignalChannel } from "./signal.service.js";
import { openSenderChannel, openReceiverChannel } from "./p2p.service.js";
import { sendFile, receiveFile } from "./transfer.service.js";
import { createSpinner } from "../utils/spinner.js";
import { MessageUtils } from "../utils/messages.js";
import { FileUtils } from "../utils/file.utils.js";
import { PromptUtils } from "../utils/prompts.js";
import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import type { Ora } from "ora";
import type { FileMeta } from "./transfer.service.js";

/**
 * Native WebRTC handles can outlive the transfer and hold the terminal open,
 * so hand the tty back once the work is done and the output is flushed.
 */
function exitCleanly(): void {
  process.stdout.write("", () => process.exit(0));
}

function progressText(label: string, bytes: number, total: number): string {
  const percent = total > 0 ? Math.min(100, Math.floor((bytes / total) * 100)) : 100;
  return `${label} ${percent}% (${FileUtils.formatFileSize(bytes)} / ${FileUtils.formatFileSize(total)})`;
}

/**
 * Picks where to save an incoming file, asking the user when the name is taken.
 */
async function chooseTarget(meta: FileMeta, targetDir: string, spinner: Ora): Promise<string> {
  // basename keeps a hostile sender from writing outside targetDir.
  const target = resolve(targetDir, basename(meta.name));
  if (!existsSync(target)) {
    return target;
  }

  const renamed = FileUtils.findFreePath(target);
  spinner.stop();
  const choice = await PromptUtils.resolveFileConflict(basename(target), basename(renamed));
  spinner.start();

  if (choice === "cancel") {
    throw new Error("Cancelled. The existing file was left untouched.");
  }
  return choice === "overwrite" ? target : renamed;
}

export class ShareService {
  /**
   * Share a file directly with one other machine — nothing touches storage.
   */
  async send(filePath: string): Promise<void> {
    try {
      const { stats, fileName } = await FileUtils.validateAndGetFileStats(filePath);
      const roomId = await SignalChannel.createRoom();

      MessageUtils.info(`\n  Open in a browser:\n`);
      MessageUtils.success(`    ${config.RECEIVE_URL}${roomId}\n`);
      MessageUtils.info(`  Or, with the CLI:\n`);
      MessageUtils.success(`    upload-it receive ${roomId}\n`);

      const channel = await SignalChannel.join(roomId);
      const spinner = createSpinner("Waiting for the other side...").start();

      try {
        const session = await openSenderChannel(channel);
        spinner.text = "Connected. Sending...";

        await sendFile(session.dataChannel, filePath, { name: fileName, size: stats.size }, (bytes) => {
          spinner.text = progressText("Sending", bytes, stats.size);
        });

        spinner.succeed(progressText("Sent", stats.size, stats.size));
        session.close();
      } catch (error) {
        spinner.fail("Transfer failed");
        throw error;
      } finally {
        channel.close();
      }

      exitCleanly();
    } catch (error) {
      MessageUtils.errorWithLabel("Send Error", (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Join a room by code and pull the file the sender is offering.
   */
  async receive(roomId: string, targetDir: string): Promise<void> {
    const channel = await SignalChannel.join(roomId).catch((error: Error) => {
      MessageUtils.errorWithLabel("Receive Error", error.message);
      process.exit(1);
    });

    const spinner = createSpinner("Connecting to the sender...").start();

    try {
      const session = await openReceiverChannel(channel);
      spinner.text = "Connected. Receiving...";

      const { path, meta } = await receiveFile(
        session.dataChannel,
        (meta) => chooseTarget(meta, targetDir, spinner),
        (bytes, total) => {
        spinner.text = progressText("Receiving", bytes, total);
      });

      spinner.succeed(progressText("Received", meta.size, meta.size));
      MessageUtils.info(`Saved to: ${path}`);
      session.close();
    } catch (error) {
      spinner.fail("Transfer failed");
      MessageUtils.errorWithLabel("Receive Error", (error as Error).message);
      process.exit(1);
    } finally {
      channel.close();
    }

    exitCleanly();
  }
}

export const shareService = new ShareService();
