import { senderMatchesPattern, type SenderPatternEntry } from "./sender-match";

export type { SenderPatternEntry as NewsSourceEntry };

export function senderMatchesNewsSources(
  sender: string | null,
  entries: SenderPatternEntry[]
): boolean {
  return senderMatchesPattern(sender, entries);
}
