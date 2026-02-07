"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { sendFeedback } from "@/lib/api";
import { cn } from "@/lib/cn";

export function FeedbackPanel({
  meetingId,
  defaultScore,
  defaultNotes,
}: {
  meetingId: number;
  defaultScore?: "up" | "down";
  defaultNotes?: string;
}) {
  const [score, setScore] = React.useState<"up" | "down" | null>(defaultScore ?? null);
  const [notes, setNotes] = React.useState(defaultNotes ?? "");
  const [status, setStatus] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit() {
    if (!score) {
      setStatus("Pick a score first.");
      return;
    }
    setPending(true);
    setStatus(null);
    try {
      await sendFeedback(meetingId, score === "up" ? 1 : 0, notes);
      setStatus("Feedback recorded.");
    } catch (err) {
      setStatus("Feedback failed. Check backend.");
    } finally {
      setPending(false);
    }
  }

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
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={handleSubmit}
          className="ml-auto"
        >
          {pending ? "Saving..." : "Save feedback"}
        </Button>
      </div>
      {status ? (
        <div className="mt-2 text-[12px] text-[var(--muted)]">{status}</div>
      ) : null}

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
          This updates the <span className="font-semibold">Steering Profile</span> for future runs.
        </div>
      </div>
    </div>
  );
}

