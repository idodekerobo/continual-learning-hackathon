import type { MeetingDetail, SteeringProfile } from "@/lib/types";

export const steeringProfile: SteeringProfile = {
  id: 1,
  product_focus:
    "Founders doing founder-led sales: turn new calendar bookings into a brief + 2 email drafts using real-time signals (news, role pains, competitors).",
  icp: "B2B SaaS founders",
  key_pains: ["Generic outreach", "Low reply rates"],
  disallowed_claims: ["game-changing", "best-in-class", "revolutionary", "synergy"],
  competitor_list: ["Apollo", "Clay", "HubSpot Sequences"],
  weight_news: 0.45,
  weight_role_pains: 0.35,
  weight_competitors: 0.2,
  specificity_rules: ["Cite sources", "Avoid vague phrases"],
  version: 3,
  updated_at: new Date().toISOString(),
};

export const meetings: MeetingDetail[] = [
  {
    id: 1,
    title: "Discovery — Data team lead",
    datetime_utc: new Date(Date.now() + 1000 * 60 * 40).toISOString(),
    company: "Verdana Labs",
    role: "Head of Data Platform",
    status: "New",
    attendees: [
      { name: "Mina Chen", email: "mina.chen@verdanalabs.io", responseStatus: "accepted" },
    ],
    insights: [
      {
        text: "Likely optimizing ETL reliability + cost as workloads scale.",
        why: "Data platform leaders get measured on SLA + budget; missed pipelines are visible.",
        priority: 1,
      },
      {
        text: "Public hiring suggests the org is investing in real-time analytics.",
        why: "The meeting will skew toward infra decisions and build-vs-buy tradeoffs.",
        priority: 2,
      },
    ],
    hooks: [
      {
        hook: "Saw your team expanding data platform roles recently — curious how you’re handling on-call for pipelines today.",
        source: "You.com news",
      },
      {
        hook: "If you’re moving toward real-time analytics, the friction is usually alerts + context switching, not the tooling itself.",
        source: "You.com news",
      },
    ],
    competitors: [
      { name: "Fivetran", positioning: "ETL reliability + cost control." },
      { name: "Airbyte", positioning: "Open-source pipelines for data teams." },
      { name: "Datadog", positioning: "Monitoring + observability for infra." },
    ],
    draft_ids: ["draft_pre_001", "draft_follow_001"],
    notion_page_id: null,
    feedback_score: null,
    feedback_notes: null,
    steering_version: 1,
    error_message: null,
  },
  {
    id: 2,
    title: "Intro — RevOps / Sales Ops",
    datetime_utc: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    company: "Northbridge AI",
    role: "RevOps Manager",
    status: "Enriched",
    attendees: [{ name: "Jordan Patel", email: "jordan@northbridge.ai" }],
    insights: [
      {
        text: "RevOps likely drowning in context switching between calendar, CRM, and email.",
        why: "The role is the glue; their pain is operational, not strategic.",
        priority: 1,
      },
      {
        text: "Competitor positioning will matter less than integration reliability.",
        why: "Ops cares about adoption + workflow fit more than brand.",
        priority: 2,
      },
    ],
    hooks: [
      {
        hook: "RevOps teams usually don’t need more tools — they need fewer tabs per meeting.",
        source: "You.com",
      },
      {
        hook: "If every booking triggered a brief + draft, what percentage of follow-ups would become one-click?",
        source: "You.com",
      },
    ],
    competitors: [
      { name: "Apollo", positioning: "Outbound + sequencing." },
      { name: "Clay", positioning: "Data enrichment." },
      { name: "HubSpot Sequences", positioning: "Email automation." },
    ],
    draft_ids: [],
    notion_page_id: null,
    feedback_score: null,
    feedback_notes: null,
    steering_version: 1,
    error_message: null,
  },
  {
    id: 3,
    title: "Follow-up — Seed-stage founder",
    datetime_utc: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(),
    company: "Fableworks",
    role: "Founder",
    status: "Drafted",
    attendees: [{ name: "Sam Rivera", email: "sam@fableworks.app" }],
    insights: [
      {
        text: "Founder likely wants speed: crisp insights, zero fluff, and a clear next step.",
        why: "Time is the constraint; concise specificity wins.",
        priority: 1,
      },
    ],
    hooks: [
      {
        hook: "If you could cut prep per meeting from 20 minutes to 2, what would you do with the time?",
        source: "You.com",
      },
    ],
    competitors: [
      { name: "ChatGPT", positioning: "General purpose assistant." },
      { name: "Notion AI", positioning: "Docs + workspace assistant." },
      { name: "Superhuman AI", positioning: "Email productivity." },
    ],
    draft_ids: ["draft_pre_003"],
    notion_page_id: null,
    feedback_score: 1,
    feedback_notes: "More concrete facts, fewer generic benefits.",
    steering_version: 1,
    error_message: null,
  },
];

export function getMeetingsSorted() {
  return [...meetings].sort((a, b) =>
    (a.datetime_utc ?? "").localeCompare(b.datetime_utc ?? ""),
  );
}

export function getMeetingById(id: string) {
  return meetings.find((m) => m.id === Number(id));
}

