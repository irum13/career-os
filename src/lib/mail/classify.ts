import type { ItemCategory } from "@/lib/types";

const JOB_ALERT_PATTERN =
  /greenhouse|lever|co\/jobs|workday|job alert|linkedin job|jobs@linkedin|jobalerts|application deadline|now hiring|we're hiring|career opportunity|recruiting|recruitment|internship|externship|fellowship opening|new jobs|job match|job recommendation|handshake|simplify|otta|indeed|glassdoor|ziprecruiter|myworkdayjobs|smartrecruiters|ashbyhq|icims/i;

export function isJobAlert(subject: string, from: string): boolean {
  return JOB_ALERT_PATTERN.test(`${subject} ${from}`);
}

export function classifyMailMessage(
  subject: string,
  from: string,
  folder: string
): ItemCategory {
  const text = `${subject} ${from}`.toLowerCase();

  if (isJobAlert(subject, from)) {
    return "alerts";
  }

  if (/tldr|the batch|ai news|artificial intelligence|machine learning|deeplearning/.test(text)) {
    return "ai_news";
  }

  if (/newsletter|digest|substack|noreply|no-reply/.test(text)) {
    return "newsletter";
  }

  // Updates / Social tabs often carry notifications — tag non-job items by folder
  if (folder === "updates" || folder === "social") {
    return "other";
  }

  return "other";
}
