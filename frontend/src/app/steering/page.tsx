"use client";

import * as React from "react";

import { Section } from "@/components/meeting/section";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { getSteering, updateSteering } from "@/lib/api";
import type { SteeringProfile } from "@/lib/types";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export default function SteeringPage() {
  const [profile, setProfile] = React.useState<SteeringProfile | null>(null);
  const [focus, setFocus] = React.useState("");
  const [icp, setIcp] = React.useState("");
  const [keyPains, setKeyPains] = React.useState("");
  const [disallowed, setDisallowed] = React.useState("");
  const [competitorList, setCompetitorList] = React.useState("");
  const [news, setNews] = React.useState(0.33);
  const [rolePains, setRolePains] = React.useState(0.33);
  const [competitors, setCompetitors] = React.useState(0.34);
  const [specificity, setSpecificity] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    getSteering()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setFocus(data.product_focus);
        setIcp(data.icp);
        setKeyPains(data.key_pains.join(", "));
        setDisallowed(data.disallowed_claims.join(", "));
        setCompetitorList(data.competitor_list.join(", "));
        setNews(data.weight_news);
        setRolePains(data.weight_role_pains);
        setCompetitors(data.weight_competitors);
        setSpecificity(data.specificity_rules.join("\n"));
      })
      .catch(() => {
        if (mounted) setStatus("Failed to load steering profile.");
      });
    return () => {
      mounted = false;
    };
  }, []);

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
            <Chip tone="new">Profile {profile?.version ?? "--"}</Chip>
            <Button
              variant="primary"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setStatus(null);
                try {
                  const payload = {
                    product_focus: focus,
                    icp,
                    key_pains: keyPains
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean),
                    disallowed_claims: disallowed
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean),
                    competitor_list: competitorList
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean),
                    weight_news: clamp01(news),
                    weight_role_pains: clamp01(rolePains),
                    weight_competitors: clamp01(competitors),
                    specificity_rules: specificity
                      .split("\n")
                      .map((p) => p.trim())
                      .filter(Boolean),
                  };
                  const updated = await updateSteering(payload);
                  setProfile(updated);
                  setStatus("Saved.");
                } catch (err) {
                  setStatus("Save failed. Check backend.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        {status ? (
          <div className="mt-3 text-[12px] text-[var(--muted)]">{status}</div>
        ) : null}
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

        <Section title="ICP + pains" eyebrow="TARGETING">
          <label className="block text-[12px] font-medium text-[var(--muted)]">ICP</label>
          <input
            value={icp}
            onChange={(e) => setIcp(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-4 py-3 text-[13px] leading-relaxed shadow-[0_10px_30px_rgba(16,19,23,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60"
          />
          <label className="mt-4 block text-[12px] font-medium text-[var(--muted)]">
            Key pains (comma-separated)
          </label>
          <textarea
            value={keyPains}
            onChange={(e) => setKeyPains(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-4 py-3 text-[13px] leading-relaxed shadow-[0_10px_30px_rgba(16,19,23,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60"
          />
          <label className="mt-4 block text-[12px] font-medium text-[var(--muted)]">
            Competitors (comma-separated)
          </label>
          <input
            value={competitorList}
            onChange={(e) => setCompetitorList(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-4 py-3 text-[13px] leading-relaxed shadow-[0_10px_30px_rgba(16,19,23,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60"
          />
          <label className="mt-4 block text-[12px] font-medium text-[var(--muted)]">
            Disallowed claims (comma-separated)
          </label>
          <input
            value={disallowed}
            onChange={(e) => setDisallowed(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-4 py-3 text-[13px] leading-relaxed shadow-[0_10px_30px_rgba(16,19,23,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60"
          />
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
          <label className="block text-[12px] font-medium text-[var(--muted)]">
            One rule per line
          </label>
          <textarea
            value={specificity}
            onChange={(e) => setSpecificity(e.target.value)}
            rows={6}
            className="mt-2 w-full resize-none rounded-[var(--radius)] border border-[var(--stroke)] bg-[var(--paper)] px-4 py-3 text-[13px] leading-relaxed shadow-[0_10px_30px_rgba(16,19,23,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60"
          />
        </Section>

        <Section title="Preview" eyebrow="WHAT CHANGES">
          <div className="space-y-3 text-[13px] leading-relaxed">
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)]">
                FOCUS
              </div>
              <div className="mt-2 line-clamp-4">{focus}</div>
            </div>
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)]">
                ICP
              </div>
              <div className="mt-2 line-clamp-3">{icp || "—"}</div>
            </div>
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--wash)] px-4 py-3 text-[12px] text-[var(--muted)]">
              This persists to the backend and applies to the next enrichment run.
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

