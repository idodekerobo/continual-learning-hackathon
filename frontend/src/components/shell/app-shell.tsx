import Link from "next/link";

import { SidebarNav } from "@/components/shell/sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] p-6 shadow-[var(--shadow)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-[var(--font-display)] text-2xl leading-none tracking-[-0.02em]">
                Trigger Monitor
              </div>
              <div className="mt-2 text-[12px] leading-snug text-[var(--muted)]">
                Always-on meeting briefs + drafts that get sharper after feedback.
              </div>
            </div>
            <div className="rounded-full border border-[var(--stroke)] bg-[var(--wash)] px-3 py-1 font-mono text-[11px] tracking-wide">
              v0
            </div>
          </div>

          <SidebarNav />

          <div className="mt-6 border-t border-[var(--stroke)] pt-5">
            <div className="text-[12px] text-[var(--muted)]">
              Demo tip: open a meeting, hit <span className="font-semibold">Run now</span>, then
              tweak Steering and see outputs change.
            </div>
            <div className="mt-3 text-[12px]">
              <Link
                href="https://you.com"
                className="underline decoration-[color:rgba(0,212,255,0.55)] underline-offset-4 hover:text-[color:rgba(16,19,23,0.75)]"
                target="_blank"
                rel="noreferrer"
              >
                you.com
              </Link>{" "}
              <span className="text-[var(--muted)]">+ composio + notion + gmail</span>
            </div>
          </div>
        </aside>

        <main className="relative">{children}</main>
      </div>
    </div>
  );
}

