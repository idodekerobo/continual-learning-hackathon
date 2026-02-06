"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function FeedbackPanel({
  defaultScore,
  defaultNotes,
}: {
  defaultScore?: "up" | "down";
  defaultNotes?: string;
}) {
  const [score, setScore] = React.useState<"up" | "down" | null>(defaultScore ?? null);
  const [notes, setNotes] = React.useState(defaultNotes ?? "");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={score === "up" ? "primary" : "secondary"}
          onClick={() => setScore("up")}
          className={cn(score === "up" ? "bg-[var(--ink)]" : "")}
        >
          👍 Helpful
        </Button>
        <Button
          type="button"
          size="sm"
          variant={score === "down" ? "primary" : "secondary"}
          onClick={() => setScore("down")}
          className={cn(score === "down" ? "bg-[var(--ink)]" : "")}
        >
          👎 Too generic
        </Button>
        <div className="ml-auto font-mono text-[11px] tracking-wide text-[var(--muted)]">
          {score ? "RECORDED (demo)" : "PENDING"}
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-[12px] font-medium text-[var(--muted)]">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Example: more concrete facts, fewer generic benefits; emphasize competitor positioning."
          className={cn(
            "mt-2 w-full resize-none rounded-2xl border border-[var(--stroke)] bg-[var(--paper)] px-4 py-3 text-[13px] leading-relaxed",
            "shadow-[0_10px_30px_rgba(16,19,23,0.08)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60",
          )}
        />
        <div className="mt-2 text-[12px] text-[var(--muted)]">
          In the full build, this updates the <span className="font-semibold">Steering Profile</span>{" "}
          for future runs.
        </div>
      </div>
    </div>
  );
}

