import type { Meeting, SteeringProfile } from "@/lib/types";

export const steeringProfile: SteeringProfile = {
  version: "v3",
  productFocus:
    "Founders doing founder-led sales: turn new calendar bookings into a brief + 2 email drafts using real-time signals (news, role pains, competitors).",
  disallowedGenericClaims: ["game-changing", "best-in-class", "revolutionary", "synergy"],
  weights: { news: 0.45, rolePains: 0.35, competitors: 0.2 },
  specificityRules: { minConcreteFacts: 2, banVaguePhrases: true },
};

export const meetings: Meeting[] = [
  {
    id: "evt_001",
    title: "Discovery — Data team lead",
    startsAtIso: new Date(Date.now() + 1000 * 60 * 40).toISOString(),
    contactName: "Mina Chen",
    contactEmail: "mina.chen@verdanalabs.io",
    company: "Verdana Labs",
    role: "Head of Data Platform",
    status: "New",
    topInsights: [
      {
        text: "Likely optimizing ETL reliability + cost as workloads scale.",
        why: "Data platform leaders get measured on SLA + budget; missed pipelines are visible.",
      },
      {
        text: "Public hiring suggests the org is investing in real-time analytics.",
        why: "The meeting will skew toward infra decisions and build-vs-buy tradeoffs.",
      },
    ],
    hooks: [
      "Saw your team expanding data platform roles recently — curious how you’re handling on-call for pipelines today.",
      "If you’re moving toward real-time analytics, the friction is usually alerts + context switching, not the tooling itself.",
    ],
    competitors: ["Fivetran", "Airbyte", "Datadog"],
    drafts: [
      {
        id: "draft_pre_001",
        subject: "Quick context for our chat tomorrow",
        body:
          "Mina — looking forward to the conversation. I noticed Verdanа Labs has been investing in the data platform org, and teams in your seat often end up spending cycles on pipeline reliability + cost control.\n\nTwo questions I’d love to use to steer the call:\n1) Where do handoffs break today (alerts, ownership, or RCA)?\n2) If you’re moving toward more real-time use cases, what’s the biggest friction in the current stack?\n\nEither way, excited to learn how you’re thinking about it.",
      },
      {
        id: "draft_follow_001",
        subject: "Follow-up + next step",
        body:
          "Mina — thanks again for the time today. Based on what you shared, the immediate win seems to be turning pipeline incidents into faster RCAs with richer context.\n\nIf it helps, I can send a short doc outlining what “always-on enrichment” could look like for your on-call flow. Want me to?",
      },
    ],
  },
  {
    id: "evt_002",
    title: "Intro — RevOps / Sales Ops",
    startsAtIso: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    contactName: "Jordan Patel",
    contactEmail: "jordan@northbridge.ai",
    company: "Northbridge AI",
    role: "RevOps Manager",
    status: "Enriched",
    lastRunIso: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    topInsights: [
      {
        text: "RevOps likely drowning in context switching between calendar, CRM, and email.",
        why: "The role is the glue; their pain is operational, not strategic.",
      },
      {
        text: "Competitor positioning will matter less than integration reliability.",
        why: "Ops cares about adoption + workflow fit more than brand.",
      },
    ],
    hooks: [
      "RevOps teams usually don’t need more tools — they need fewer tabs per meeting.",
      "If every booking triggered a brief + draft, what percentage of follow-ups would become ‘one-click’?",
    ],
    competitors: ["Apollo", "Clay", "HubSpot Sequences"],
    drafts: [],
  },
  {
    id: "evt_003",
    title: "Follow-up — Seed-stage founder",
    startsAtIso: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(),
    contactName: "Sam Rivera",
    contactEmail: "sam@fableworks.app",
    company: "Fableworks",
    role: "Founder",
    status: "Drafted",
    lastRunIso: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    topInsights: [
      {
        text: "Founder likely wants speed: crisp insights, zero fluff, and a clear next step.",
        why: "Time is the constraint; concise specificity wins.",
      },
    ],
    hooks: ["If you could cut prep per meeting from 20 minutes to 2, what would you do with the time?"],
    competitors: ["ChatGPT", "Notion AI", "Superhuman AI"],
    drafts: [
      {
        id: "draft_pre_003",
        subject: "2-min pre-read for tomorrow",
        body:
          "Sam — I kept this short. I pulled 2 signals about Fableworks and drafted two discovery questions that’ll help us figure out fit fast.\n\nIf you’d rather, I can just send the brief and let you pick what to ignore.",
      },
    ],
    feedback: { score: "up", notes: "More concrete facts, fewer generic benefits." },
  },
];

export function getMeetingsSorted() {
  return [...meetings].sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso));
}

export function getMeetingById(id: string) {
  return meetings.find((m) => m.id === id);
}

