import Link from "next/link";
import { notFound } from "next/navigation";

import { FeedbackPanel } from "@/components/meeting/feedback-panel";
import { RunMeetingButton } from "@/components/meeting/meeting-actions";
import { Section } from "@/components/meeting/section";
import { StatusChip } from "@/components/meeting/status-chip";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { getMeeting } from "@/lib/api";

function formatWhen(iso: string | null) {
  if (!iso) return "TBD";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function MeetingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const meetingId = Number(params.id);
  if (Number.isNaN(meetingId)) notFound();

  const meeting = await getMeeting(meetingId);
  if (!meeting) notFound();

  const primary = meeting.attendees?.[0];
  const contactName = primary?.name || primary?.email || "Unknown";
  const feedbackScore =
    meeting.feedback_score === 1 ? "up" : meeting.feedback_score === 0 ? "down" : undefined;

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
                {formatWhen(meeting.datetime_utc)}
              </span>
              <span className="opacity-60">•</span>
              <span className="truncate">
                {contactName}{" "}
                <span className="opacity-70">({meeting.role ?? "Unknown"})</span>
              </span>
              <span className="opacity-60">•</span>
              <span className="truncate">{meeting.company ?? "Unknown"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RunMeetingButton meetingId={meeting.id} />
            <Link href="/">
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Prioritized insights" eyebrow="WHY IT MATTERS">
          <ol className="space-y-4">
            {meeting.insights.map((insight, idx) => (
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
                <div className="text-[13px] leading-relaxed">{hook.hook}</div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Section title="Competitors + positioning" eyebrow="LANDSCAPE" className="lg:col-span-1">
          <div className="flex flex-wrap gap-2">
            {meeting.competitors.length ? (
              meeting.competitors.map((c, idx) => (
                <Chip key={`${c.name}-${idx}`} tone="enriched">
                  {c.name}
                </Chip>
              ))
            ) : (
              <div className="text-[13px] text-[var(--muted)]">No competitor notes yet.</div>
            )}
          </div>
          {meeting.competitors.length ? (
            <div className="mt-4 space-y-2 text-[12px] leading-relaxed text-[var(--muted)]">
              {meeting.competitors.map((c, idx) =>
                c.positioning ? <div key={`${c.name}-pos-${idx}`}>{c.positioning}</div> : null,
              )}
            </div>
          ) : null}
        </Section>

        <Section title="Email draft previews" eyebrow="GMAIL DRAFTS" className="lg:col-span-2">
          {meeting.draft_ids.length ? (
            <div className="space-y-4">
              {meeting.draft_ids.map((id) => (
                <div key={id} className="rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-5 py-4">
                  <div className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)]">
                    DRAFT ID
                  </div>
                  <div className="mt-2 text-[14px] font-semibold tracking-tight">{id}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--wash)] px-5 py-4 text-[13px] text-[var(--muted)]">
              No drafts yet. Hit <span className="font-semibold">Run now</span> to generate drafts.
            </div>
          )}
        </Section>
      </div>

      <Section title="Feedback" eyebrow="CONTINUAL LEARNING">
        <FeedbackPanel
          meetingId={meeting.id}
          defaultScore={feedbackScore}
          defaultNotes={meeting.feedback_notes ?? undefined}
        />
      </Section>
    </div>
  );
}

