import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/receive";
import { receiveFile, saveFile, type ReceivedFile } from "~/lib/p2p";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Receive a file | Upload It" },
    { name: "description", content: "Receive a file sent straight from someone's terminal." },
    // A transfer link is single-use, so keep it out of search results.
    { name: "robots", content: "noindex" },
  ];
}

function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(2)} ${units[unit]}`;
}

export default function Receive({ params }: Route.ComponentProps) {
  const [status, setStatus] = useState("Connecting...");
  const [progress, setProgress] = useState({ received: 0, total: 0 });
  const [file, setFile] = useState<ReceivedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // Strict mode mounts effects twice; a second peer would fill the room.
    if (started.current) return;
    started.current = true;

    receiveFile(params.code, {
      onStatus: setStatus,
      onProgress: (received, total) => setProgress({ received, total }),
    })
      .then((result) => {
        setFile(result);
        setStatus("Done");
        saveFile(result);
      })
      .catch((err: Error) => setError(err.message));
  }, [params.code]);

  const percent = progress.total > 0 ? Math.floor((progress.received / progress.total) * 100) : 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-neutral-100">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="text-lg font-medium">Receive a file</h1>
        <p className="mt-1 font-mono text-sm text-neutral-500">{params.code}</p>

        {error ? (
          <p className="mt-6 text-sm text-red-400">{error}</p>
        ) : (
          <>
            <p className="mt-6 text-sm text-neutral-400">{status}</p>

            {progress.total > 0 && (
              <>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-150"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  {percent}% — {formatSize(progress.received)} / {formatSize(progress.total)}
                </p>
              </>
            )}

            {file && (
              <button
                type="button"
                onClick={() => saveFile(file)}
                className="mt-6 w-full rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
              >
                Save {file.name}
              </button>
            )}
          </>
        )}

        <p className="mt-8 text-xs text-neutral-600">
          The file transfers directly between the two machines. It never touches a server.
        </p>
      </div>
    </main>
  );
}
