import * as React from "react";

import { cn } from "@/lib/cn";

export type ChipTone = "ink" | "new" | "enriched" | "drafted" | "feedback";

const tones: Record<ChipTone, string> = {
  ink: "bg-[var(--ink)] text-[var(--paper)]",
  new: "bg-[color:rgba(0,212,255,0.22)] text-[var(--accent-ink)] border border-[color:rgba(0,212,255,0.35)]",
  enriched:
    "bg-[color:rgba(16,19,23,0.06)] text-[var(--ink)] border border-[var(--stroke)]",
  drafted:
    "bg-[color:rgba(255,168,0,0.16)] text-[color:#5b3b00] border border-[color:rgba(255,168,0,0.26)]",
  feedback:
    "bg-[color:rgba(0,164,98,0.16)] text-[color:#00341e] border border-[color:rgba(0,164,98,0.26)]",
};

export function Chip({
  className,
  tone = "enriched",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium tracking-wide",
        "shadow-[0_8px_20px_rgba(16,19,23,0.08)]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

