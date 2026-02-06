import * as React from "react";

import { cn } from "@/lib/cn";

export function Section({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)]",
        "shadow-[0_18px_60px_rgba(16,19,23,0.10)]",
        className,
      )}
    >
      <div className="border-b border-[var(--stroke)] px-6 py-5">
        {eyebrow ? (
          <div className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)]">
            {eyebrow}
          </div>
        ) : null}
        <div className="mt-2 font-[var(--font-display)] text-xl leading-tight tracking-[-0.02em]">
          {title}
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

