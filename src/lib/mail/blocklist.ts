export type BlocklistMatchType = "email" | "domain" | "contains";

export interface BlocklistEntry {
  pattern: string;
  match_type: BlocklistMatchType;
}

/** Pull address from `"Name" <email@domain.com>` or plain email */
export function extractEmail(sender: string | null): string | null {
  if (!sender) return null;
  const bracket = sender.match(/<([^>]+)>/);
  if (bracket) return bracket[1].trim().toLowerCase();
  if (sender.includes("@")) return sender.trim().toLowerCase();
  return null;
}

export function senderMatchesBlocklist(
  sender: string | null,
  entries: BlocklistEntry[]
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

/** Guess blocklist type from user input */
export function inferBlocklistType(input: string): BlocklistMatchType {
  const trimmed = input.trim();
  if (trimmed.includes("@") && !trimmed.includes(" ")) {
    return trimmed.startsWith("@") ? "domain" : "email";
  }
  if (trimmed.startsWith("@")) return "domain";
  return "contains";
}
