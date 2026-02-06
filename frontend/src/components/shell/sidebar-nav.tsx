"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

type NavItem = {
  href: string;
  label: string;
  hint: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "Today / Upcoming", hint: "Queue + statuses" },
  { href: "/steering", label: "Feedback & Steering", hint: "Continual learning" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex flex-col gap-2">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group rounded-2xl border px-4 py-3 transition-colors",
              active
                ? "border-[color:rgba(0,212,255,0.40)] bg-[color:rgba(0,212,255,0.12)]"
                : "border-[var(--stroke)] bg-[var(--paper)] hover:bg-[var(--wash)]",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold tracking-tight">{item.label}</div>
              <span
                className={cn(
                  "font-mono text-[11px] tracking-wide opacity-70 transition-opacity",
                  "group-hover:opacity-100",
                )}
              >
                {active ? "ACTIVE" : "OPEN"}
              </span>
            </div>
            <div className="mt-1 text-[12px] leading-snug text-[var(--muted)]">
              {item.hint}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

