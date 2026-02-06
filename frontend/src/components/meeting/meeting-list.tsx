"use client";

import Link from "next/link";

import type { Meeting } from "@/lib/types";

import { StatusChip } from "@/components/meeting/status-chip";
import { cn } from "@/lib/cn";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MeetingList({ items }: { items: Meeting[] }) {
  return (
    <div className="grid gap-3">
      {items.map((m) => {
        return (
          <Link
            key={m.id}
            href={`/meetings/${m.id}`}
            className={cn(
              "group rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-5 py-4",
              "shadow-[0_18px_60px_rgba(16,19,23,0.10)] transition-[transform,box-shadow,background-color]",
              "hover:translate-y-[-1px] hover:bg-[color:rgba(0,212,255,0.06)]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-[15px] font-semibold tracking-tight">
                    {m.title}
                  </div>
                  <StatusChip status={m.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--muted)]">
                  <span className="font-mono tracking-wide">{formatTime(m.startsAtIso)}</span>
                  <span className="opacity-60">•</span>
                  <span className="truncate">
                    {m.contactName} <span className="opacity-60">({m.role})</span>
                  </span>
                  <span className="opacity-60">•</span>
                  <span className="truncate">{m.company}</span>
                </div>
              </div>
              <div className="mt-1 hidden shrink-0 font-mono text-[11px] tracking-wide text-[var(--muted)] sm:block">
                {m.lastRunIso ? (
                  <>
                    LAST RUN
                    <div className="mt-1 text-[12px] text-[var(--ink)]/80">
                      {new Date(m.lastRunIso).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </>
                ) : (
                  "READY"
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

