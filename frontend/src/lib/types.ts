export type MeetingStatus = "New" | "Enriched" | "Drafted" | "Feedback Given";

export type EmailDraft = {
  id: string;
  subject: string;
  body: string;
};

export type Meeting = {
  id: string;
  title: string;
  startsAtIso: string;
  contactName: string;
  contactEmail: string;
  company: string;
  role: string;
  status: MeetingStatus;
  lastRunIso?: string;
  topInsights: Array<{ text: string; why: string }>;
  hooks: string[];
  competitors: string[];
  drafts: EmailDraft[];
  feedback?: {
    score: "up" | "down";
    notes?: string;
  };
};

export type SteeringProfile = {
  version: string;
  productFocus: string;
  disallowedGenericClaims: string[];
  weights: {
    news: number; // 0..1
    rolePains: number; // 0..1
    competitors: number; // 0..1
  };
  specificityRules: {
    minConcreteFacts: number;
    banVaguePhrases: boolean;
  };
};

