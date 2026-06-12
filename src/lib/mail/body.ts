const MAX_BODY_CHARS = 50_000;

interface GmailPart {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFromPart(part: GmailPart): string | null {
  if (part.parts?.length) {
    for (const child of part.parts) {
      const plain = extractFromPart(child);
      if (plain) return plain;
    }
  }

  const data = part.body?.data;
  if (!data) return null;

  const decoded = decodeBase64Url(data);
  if (part.mimeType === "text/plain") return decoded.trim();
  if (part.mimeType === "text/html") return stripHtml(decoded);
  return null;
}

export function extractPlainBodyFromGmailPayload(payload: GmailPart | undefined): string | null {
  if (!payload) return null;
  const text = extractFromPart(payload);
  if (!text) return null;
  return text.length > MAX_BODY_CHARS ? text.slice(0, MAX_BODY_CHARS) : text;
}
