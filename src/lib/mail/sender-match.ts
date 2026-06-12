export type SenderMatchType = "email" | "domain" | "contains";

export interface SenderPatternEntry {
  pattern: string;
  match_type: SenderMatchType;
}

export function extractEmail(sender: string | null): string | null {
  if (!sender) return null;
  const bracket = sender.match(/<([^>]+)>/);
  if (bracket) return bracket[1].trim().toLowerCase();
  if (sender.includes("@")) return sender.trim().toLowerCase();
  return null;
}

export function senderMatchesPattern(
  sender: string | null,
  entries: SenderPatternEntry[]
): boolean {
  if (!sender || !entries.length) return false;
  const email = extractEmail(sender);
  const lower = sender.toLowerCase();

  for (const { pattern, match_type } of entries) {
    const p = pattern.toLowerCase().trim();
    if (!p) continue;

    if (match_type === "email" && email === p) return true;

    if (match_type === "domain") {
      const domain = p.startsWith("@") ? p : `@${p}`;
      if (email?.endsWith(domain)) return true;
      if (lower.includes(domain)) return true;
    }

    if (match_type === "contains" && (lower.includes(p) || email?.includes(p))) {
      return true;
    }
  }

  return false;
}

export function inferSenderMatchType(input: string): SenderMatchType {
  const trimmed = input.trim();
  if (trimmed.includes("@") && !trimmed.includes(" ")) {
    return trimmed.startsWith("@") ? "domain" : "email";
  }
  if (trimmed.startsWith("@")) return "domain";
  return "contains";
}
