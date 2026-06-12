export interface OutlookMessage {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  receivedAt: string;
  folder: string;
  webLink: string | null;
}

const OUTLOOK_FOLDERS = [
  { id: "inbox", graphName: "inbox" },
  { id: "junk", graphName: "junkemail" },
  { id: "other", graphName: "other" },
];

export async function fetchOutlookMessages(
  accessToken: string,
  since: Date,
  folders: { inbox: boolean; promotions: boolean; junk: boolean }
): Promise<OutlookMessage[]> {
  const messages: OutlookMessage[] = [];
  const sinceIso = since.toISOString();

  for (const folder of OUTLOOK_FOLDERS) {
    if (folder.id === "inbox" && !folders.inbox) continue;
    if (folder.id === "other" && !folders.promotions) continue;
    if (folder.id === "junk" && !folders.junk) continue;

    const url = new URL(
      `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.graphName}/messages`
    );
    url.searchParams.set("$filter", `receivedDateTime ge ${sinceIso}`);
    url.searchParams.set("$top", "50");
    url.searchParams.set("$select", "id,subject,from,bodyPreview,receivedDateTime,webLink");
    url.searchParams.set("$orderby", "receivedDateTime desc");

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error(`Outlook fetch failed for ${folder.id}:`, await res.text());
      continue;
    }

    const data = await res.json();
    for (const msg of data.value ?? []) {
      messages.push({
        id: msg.id,
        subject: msg.subject || "(no subject)",
        from: msg.from?.emailAddress?.address ?? "",
        snippet: msg.bodyPreview ?? "",
        receivedAt: msg.receivedDateTime,
        folder: folder.id === "other" ? "promotions" : folder.id,
        webLink: msg.webLink ?? null,
      });
    }
  }

  return messages;
}

export { classifyMailMessage as classifyOutlookMessage } from "./classify";

function getMicrosoftTenantId() {
  // Single-tenant apps (e.g. UH college accounts) require a tenant-specific endpoint.
  return process.env.MICROSOFT_TENANT_ID || "common";
}

function getMicrosoftOAuthBase() {
  return `https://login.microsoftonline.com/${getMicrosoftTenantId()}/oauth2/v2.0`;
}

export function getOutlookAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    response_type: "code",
    scope: "openid offline_access Mail.Read User.Read",
    state,
  });
  return `${getMicrosoftOAuthBase()}/authorize?${params}`;
}

export async function exchangeOutlookCode(code: string) {
  const res = await fetch(`${getMicrosoftOAuthBase()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });
  return res.json();
}

export async function refreshOutlookToken(refreshToken: string) {
  const res = await fetch(`${getMicrosoftOAuthBase()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  return res.json();
}

export async function getOutlookProfile(accessToken: string) {
  const res = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}
