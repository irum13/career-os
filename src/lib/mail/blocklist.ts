import {
  extractEmail,
  inferSenderMatchType,
  senderMatchesPattern,
  type SenderMatchType,
  type SenderPatternEntry,
} from "./sender-match";

export type BlocklistMatchType = SenderMatchType;
export type BlocklistEntry = SenderPatternEntry;

export { extractEmail, inferSenderMatchType as inferBlocklistType };

export function senderMatchesBlocklist(
  sender: string | null,
  entries: BlocklistEntry[]
): boolean {
  return senderMatchesPattern(sender, entries);
}
