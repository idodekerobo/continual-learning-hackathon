import Link from "next/link";
import { notFound } from "next/navigation";

import { FeedbackPanel } from "@/components/meeting/feedback-panel";
import { Section } from "@/components/meeting/section";
import { StatusChip } from "@/components/meeting/status-chip";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { getMeetingById } from "@/lib/mock";

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MeetingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const meeting = getMeetingById(params.id);
  if (!meeting) notFound();

  return (
    <div className="space-y-6">
      <header className="rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-7 py-6 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-mono text-[11px] tracking-[0.22em] text-[var(--muted)]">
                MEETING DOSSIER
              </div>
              <StatusChip status={meeting.status} />
            </div>
            <h1 className="mt-2 truncate font-[var(--font-display)] text-3xl leading-tight tracking-[-0.03em]">
              {meeting.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--muted)]">
              <span className="font-mono text-[12px] tracking-wide text-[var(--ink)]/75">
                {formatWhen(meeting.startsAtIso)}
              </span>
              <span className="opacity-60">•</span>
              <span className="truncate">
                {meeting.contactName}{" "}
                <span className="opacity-70">({meeting.role})</span>
              </span>
              <span className="opacity-60">•</span>
              <span className="truncate">{meeting.company}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary">Run now</Button>
            <Link href="/">
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Prioritized insights" eyebrow="WHY IT MATTERS">
          <ol className="space-y-4">
            {meeting.topInsights.map((insight, idx) => (
              <li key={idx} className="rounded-2xl border border-[var(--stroke)] bg-[var(--wash)] px-4 py-3">
                <div className="text-[13px] font-semibold leading-relaxed">{insight.text}</div>
                <div className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
                  {insight.why}
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Personalization hooks" eyebrow="OPENERS">
          <ul className="space-y-3">
            {meeting.hooks.map((hook, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)] shadow-[0_0_0_6px_rgba(0,212,255,0.12)]" />
                <div className="text-[13px] leading-relaxed">{hook}</div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Section title="Competitors + positioning" eyebrow="LANDSCAPE" className="lg:col-span-1">
          <div className="flex flex-wrap gap-2">
            {meeting.competitors.length ? (
              meeting.competitors.map((c) => <Chip key={c} tone="enriched">{c}</Chip>)
            ) : (
              <div className="text-[13px] text-[var(--muted)]">No competitor notes yet.</div>
            )}
          </div>
          <div className="mt-4 text-[12px] leading-relaxed text-[var(--muted)]">
            In the full agent run, we’d synthesize “where we win” based on the Steering Profile.
          </div>
        </Section>

        <Section title="Email draft previews" eyebrow="GMAIL DRAFTS" className="lg:col-span-2">
          {meeting.drafts.length ? (
            <div className="space-y-4">
              {meeting.drafts.map((d) => (
                <div key={d.id} className="rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)]">
                  <div className="border-b border-[var(--stroke)] px-5 py-4">
                    <div className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)]">
                      SUBJECT
                    </div>
                    <div className="mt-2 text-[14px] font-semibold tracking-tight">
                      {d.subject}
                    </div>
                  </div>
                  <div className="px-5 py-5">
                    <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--ink)]/90">
                      {d.body}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--wash)] px-5 py-4 text-[13px] text-[var(--muted)]">
              No drafts yet. Hit <span className="font-semibold">Run now</span> to generate drafts
              (demo placeholder).
            </div>
          )}
        </Section>
      </div>

      <Section title="Feedback" eyebrow="CONTINUAL LEARNING">
        <FeedbackPanel
          defaultScore={meeting.feedback?.score}
          defaultNotes={meeting.feedback?.notes}
        />
      </Section>
    </div>
  );
}

