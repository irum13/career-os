import { getGmailMessageUrl } from "./urls";

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  receivedAt: string;
  folder: string;
  webUrl: string;
}

const GMAIL_FOLDERS = [
  { id: "INBOX", label: "inbox", query: "in:inbox" },
  { id: "CATEGORY_PROMOTIONS", label: "promotions", query: "category:promotions" },
  { id: "CATEGORY_UPDATES", label: "updates", query: "category:updates" },
  { id: "CATEGORY_SOCIAL", label: "social", query: "category:social" },
  { id: "SPAM", label: "junk", query: "in:spam" },
];

export async function fetchGmailMessages(
  accessToken: string,
  since: Date,
  folders: {
    inbox: boolean;
    promotions: boolean;
    junk: boolean;
    updates?: boolean;
    social?: boolean;
  }
): Promise<GmailMessage[]> {
  const messages: GmailMessage[] = [];
  const afterEpoch = Math.floor(since.getTime() / 1000);
  const scanUpdates = folders.updates !== false;
  const scanSocial = folders.social !== false;

  for (const folder of GMAIL_FOLDERS) {
    if (folder.label === "inbox" && !folders.inbox) continue;
    if (folder.label === "promotions" && !folders.promotions) continue;
    if (folder.label === "junk" && !folders.junk) continue;
    if (folder.label === "updates" && !scanUpdates) continue;
    if (folder.label === "social" && !scanSocial) continue;

    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("q", `${folder.query} after:${afterEpoch}`);
    listUrl.searchParams.set("maxResults", "50");

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      console.error(`Gmail list failed for ${folder.label}:`, await listRes.text());
      continue;
    }

    const listData = await listRes.json();
    const ids: string[] = (listData.messages ?? []).map((m: { id: string }) => m.id);

    for (const id of ids.slice(0, 30)) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!msgRes.ok) continue;

      const msg = await msgRes.json();
      const headers: { name: string; value: string }[] = msg.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";

      messages.push({
        id: msg.id,
        subject: get("Subject") || "(no subject)",
        from: get("From"),
        snippet: msg.snippet ?? "",
        receivedAt: new Date(parseInt(msg.internalDate)).toISOString(),
        folder: folder.label,
        webUrl: getGmailMessageUrl(msg.id),
      });
    }
  }

  return messages;
}

export { classifyMailMessage as classifyGmailMessage } from "./classify";

export function getGmailAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGmailCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });
  return res.json();
}

export async function refreshGmailToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  return res.json();
}
