import Link from "next/link";

import { MeetingList } from "@/components/meeting/meeting-list";
import { Section } from "@/components/meeting/section";
import { TriggerPollButton } from "@/components/meeting/meeting-actions";
import { Button } from "@/components/ui/button";
import { getMeetings } from "@/lib/api";

export default async function Home() {
  const items = await getMeetings();

  return (
    <div className="space-y-6">
      <header className="rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-7 py-6 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.22em] text-[var(--muted)]">
              ALWAYS-ON TRIGGER
            </div>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl leading-[1.05] tracking-[-0.03em]">
              Today / Upcoming
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--muted)]">
              When a new meeting booking lands, the agent enriches in real-time and generates a
              brief + Gmail drafts. Feedback here becomes steering for future runs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TriggerPollButton />
            <Link href="/steering">
              <Button variant="secondary">Steering</Button>
            </Link>
          </div>
        </div>
      </header>

      <Section
        title="Queue"
        eyebrow="MEETINGS"
        className="bg-[color:rgba(255,255,255,0.88)] backdrop-blur"
      >
        <MeetingList items={items} />
      </Section>
    </div>
  );
}
