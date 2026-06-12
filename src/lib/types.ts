export type ItemPriority = "unclassified" | "high" | "medium" | "low" | "dismissed";
export type ItemCategory = "newsletter" | "job_alert" | "ai_news" | "other" | "alerts";
export type SourceType = "gmail" | "outlook" | "manual" | "rss" | "reddit" | "github";
export interface NewsBriefIdea {
  title: string;
  description: string;
}
export type JobStatus = "interested" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";
export type ScholarshipStatus = "interested" | "applied" | "awarded" | "rejected" | "withdrawn";
export type ActionStatus = "drafting" | "pending_approval" | "approved" | "executed" | "cancelled";

export interface Profile {
  id: string;
  full_name: string | null;
  location: string;
  timezone: string;
  status: string;
  school: string;
  program: string;
  career_focus: string;
}

export interface Item {
  id: string;
  user_id: string;
  source_type: SourceType;
  external_id?: string | null;
  title: string;
  summary: string | null;
  body_text?: string | null;
  url: string | null;
  sender: string | null;
  folder: string | null;
  category: ItemCategory;
  priority: ItemPriority;
  received_at: string;
}

export interface NewsBrief {
  id: string;
  summary_text: string;
  ideas_json: NewsBriefIdea[];
  item_ids: string[];
  generated_at: string;
}

export interface Deadline {
  id: string;
  title: string;
  due_date: string;
  notice_days: number[];
  entity_type: string | null;
  notes: string | null;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  url: string | null;
  notes: string | null;
  applied_at: string | null;
  updated_at: string;
}

export interface Scholarship {
  id: string;
  name: string;
  organization: string | null;
  status: ScholarshipStatus;
  url: string | null;
  amount: string | null;
  notes: string | null;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number | null;
  renewal_date: string | null;
  cancel_url: string | null;
  notes: string | null;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  context: string | null;
  last_contacted: string | null;
  follow_up_date: string | null;
  chat_questions: string | null;
  notes: string | null;
}

export interface Alert {
  id: string;
  message: string;
  days_before: number | null;
  read_at: string | null;
  created_at: string;
}

export interface ActionRequest {
  id: string;
  action_type: string;
  title: string;
  request_text: string | null;
  draft_content: string | null;
  status: ActionStatus;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  provider: "gmail" | "outlook";
  email: string;
  scan_inbox: boolean;
  scan_promotions: boolean;
  scan_junk: boolean;
  last_sync_at: string | null;
}

export type CaptureType = "job" | "scholarship" | "event" | "idea" | "link" | "deadline";
