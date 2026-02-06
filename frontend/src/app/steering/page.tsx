"use client";

import * as React from "react";

import { Section } from "@/components/meeting/section";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { steeringProfile } from "@/lib/mock";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export default function SteeringPage() {
  const [focus, setFocus] = React.useState(steeringProfile.productFocus);
  const [news, setNews] = React.useState(steeringProfile.weights.news);
  const [rolePains, setRolePains] = React.useState(steeringProfile.weights.rolePains);
  const [competitors, setCompetitors] = React.useState(steeringProfile.weights.competitors);
  const [facts, setFacts] = React.useState(steeringProfile.specificityRules.minConcreteFacts);
  const [banVague, setBanVague] = React.useState(steeringProfile.specificityRules.banVaguePhrases);

  const normalized = (() => {
    const sum = news + rolePains + competitors;
    if (sum <= 0) return { news: 0, rolePains: 0, competitors: 0 };
    return { news: news / sum, rolePains: rolePains / sum, competitors: competitors / sum };
  })();

  return (
    <div className="space-y-6">
      <header className="rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-7 py-6 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.22em] text-[var(--muted)]">
              STEERING PROFILE
            </div>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl leading-[1.05] tracking-[-0.03em]">
              Feedback & Steering
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--muted)]">
              This is the “visible learning” moment for the demo: pivot the focus, rebalance
              weights, and future meeting outputs change immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="new">Profile {steeringProfile.version}</Chip>
            <Button variant="primary">Save (demo)</Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Product focus pivot" eyebrow="WORDS THAT SHAPE SEARCH">
          <label className="block text-[12px] font-medium text-[var(--muted)]">
            Describe what to emphasize in briefs + drafts
          </label>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            rows={7}
            className="mt-2 w-full resize-none rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-4 py-3 text-[13px] leading-relaxed shadow-[0_10px_30px_rgba(16,19,23,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60"
          />
          <div className="mt-3 text-[12px] leading-relaxed text-[var(--muted)]">
            This value should feed directly into You.com query templates (company news, role pains,
            competitor landscape) and the synthesis ranking.
          </div>
        </Section>

        <Section title="Prioritization weights" eyebrow="RANKING">
          <div className="space-y-4">
            <Weight
              label="Company news"
              value={news}
              onChange={setNews}
              hint={`${Math.round(normalized.news * 100)}% after normalize`}
            />
            <Weight
              label="Role pains"
              value={rolePains}
              onChange={setRolePains}
              hint={`${Math.round(normalized.rolePains * 100)}% after normalize`}
            />
            <Weight
              label="Competitors"
              value={competitors}
              onChange={setCompetitors}
              hint={`${Math.round(normalized.competitors * 100)}% after normalize`}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--stroke)] bg-[var(--wash)] px-4 py-3 text-[12px] text-[var(--muted)]">
            In the backend, these weights influence which insights bubble to the top and how much
            space each section gets in the brief.
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Section title="Specificity rules" eyebrow="ANTI-GENERIC" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--paper)] px-4 py-4">
              <div className="text-[13px] font-semibold tracking-tight">Minimum concrete facts</div>
              <div className="mt-2 text-[12px] text-[var(--muted)]">
                Enforce \(N\) factual anchors per output.
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setFacts((f) => Math.max(0, f - 1))}
                >
                  −
                </Button>
                <div className="min-w-10 rounded-full border border-[var(--stroke)] bg-[var(--wash)] px-3 py-2 text-center font-mono text-[12px]">
                  {facts}
                </div>
                <Button type="button" size="sm" onClick={() => setFacts((f) => f + 1)}>
                  +
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--paper)] px-4 py-4">
              <div className="text-[13px] font-semibold tracking-tight">Ban vague phrases</div>
              <div className="mt-2 text-[12px] text-[var(--muted)]">
                Push drafts toward concrete claims and cited signals.
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  id="banVague"
                  type="checkbox"
                  checked={banVague}
                  onChange={(e) => setBanVague(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <label htmlFor="banVague" className="text-[13px]">
                  {banVague ? "Enabled" : "Disabled"}
                </label>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Preview" eyebrow="WHAT CHANGES">
          <div className="space-y-3 text-[13px] leading-relaxed">
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)]">
                FOCUS
              </div>
              <div className="mt-2 line-clamp-4">{focus}</div>
            </div>
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--wash)] px-4 py-3 text-[12px] text-[var(--muted)]">
              This is a UI-only preview; the backend would persist this and apply on the next
              enrichment run.
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Weight({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--paper)] px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[13px] font-semibold tracking-tight">{label}</div>
        <div className="font-mono text-[11px] tracking-wide text-[var(--muted)]">{hint}</div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={clamp01(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="w-14 rounded-full border border-[var(--stroke)] bg-[var(--wash)] px-3 py-1 text-center font-mono text-[12px]">
          {Math.round(value * 100)}
        </div>
      </div>
    </div>
  );
}

