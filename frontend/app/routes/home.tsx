import { useState } from "react";
import { Copy, Check, Terminal, ArrowRight } from "lucide-react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Upload-It" },
    { name: "description", content: "Upload files from your terminal." },
  ];
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative mt-2 flex items-center justify-between rounded-lg border border-black/10 bg-black/[0.03] px-4 py-3 font-mono text-sm dark:border-white/10 dark:bg-white/[0.03]">
      <span className="text-black dark:text-white">{children}</span>
      <button
        onClick={copy}
        className="ml-4 shrink-0 text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors cursor-pointer"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}

const steps = [
  { label: "Login", command: "npx @devsargam/upload-it@latest login" },
  { label: "Upload", command: "npx @devsargam/upload-it@latest ./photo.png" },
  { label: "List files", command: "npx @devsargam/upload-it@latest list" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-black">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-black dark:bg-white">
            <Terminal size={20} className="text-white dark:text-black" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
            Upload-It
          </h1>
        </div>

        <p className="mt-4 text-base text-black/50 dark:text-white/50 leading-relaxed">
          Share files from your terminal. One command, instant link.
        </p>

        <div className="mt-10 space-y-5">
          {steps.map((step, i) => (
            <div key={step.label}>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black/40 dark:text-white/40">
                <span className="flex items-center justify-center w-5 h-5 rounded-full border border-black/20 dark:border-white/20 text-[10px] text-black/50 dark:text-white/50">
                  {i + 1}
                </span>
                {step.label}
              </div>
              <CodeBlock>{step.command}</CodeBlock>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-2 text-sm text-black/30 dark:text-white/30">
          <ArrowRight size={14} />
          <span>Files stored on Cloudflare R2. Served instantly.</span>
        </div>
      </div>
    </div>
  );
}
