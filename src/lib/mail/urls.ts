import type { SourceType } from "@/lib/types";

/** Direct link to open a message in Gmail web UI */
export function getGmailMessageUrl(messageId: string) {
  return `https://mail.google.com/mail/u/0/#all/${messageId}`;
}

/** Direct link to open a message in Outlook web UI */
export function getOutlookMessageUrl(messageId: string) {
  return `https://outlook.office.com/mail/inbox/id/${encodeURIComponent(messageId)}`;
}

export function getMailWebUrl(item: {
  source_type: SourceType;
  external_id: string | null;
  url: string | null;
}): { href: string; label: string } | null {
  if (item.url) {
    const label =
      item.source_type === "gmail"
        ? "Open in Gmail"
        : item.source_type === "outlook"
          ? "Open in Outlook"
          : "Open link";
    return { href: item.url, label };
  }

  if (!item.external_id) return null;

  if (item.source_type === "gmail") {
    return { href: getGmailMessageUrl(item.external_id), label: "Open in Gmail" };
  }
  if (item.source_type === "outlook") {
    return { href: getOutlookMessageUrl(item.external_id), label: "Open in Outlook" };
  }

  return null;
}
