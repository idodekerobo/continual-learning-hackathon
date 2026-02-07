export type MeetingStatus =
  | "New"
  | "Enriching"
  | "Enriched"
  | "Drafted"
  | "FeedbackGiven"
  | "Error";

export type MeetingListItem = {
  id: number;
  title: string;
  datetime_utc: string | null;
  company?: string | null;
  role?: string | null;
  status: MeetingStatus;
};

export type MeetingDetail = MeetingListItem & {
  attendees: Array<{ email?: string | null; name?: string | null; responseStatus?: string | null }>;
  insights: Array<{ text: string; why: string; priority: number }>;
  hooks: Array<{ hook: string; source: string }>;
  competitors: Array<{ name: string; positioning?: string }>;
  draft_ids: string[];
  notion_page_id?: string | null;
  feedback_score?: number | null;
  feedback_notes?: string | null;
  steering_version?: number | null;
  error_message?: string | null;
};

export type SteeringProfile = {
  id: number;
  product_focus: string;
  icp: string;
  key_pains: string[];
  disallowed_claims: string[];
  competitor_list: string[];
  weight_news: number;
  weight_role_pains: number;
  weight_competitors: number;
  specificity_rules: string[];
  version: number;
  updated_at: string;
};

export type SteeringProfileUpdate = Partial<
  Omit<SteeringProfile, "id" | "version" | "updated_at">
>;

export type TriggerPollResponse = {
  new_meetings: number;
  processed_meetings: number;
};

