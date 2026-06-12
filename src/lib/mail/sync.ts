import { createServiceClient } from "@/lib/supabase/server";
import {
  fetchGmailMessages,
  classifyGmailMessage,
  refreshGmailToken,
} from "./gmail";
import {
  fetchOutlookMessages,
  classifyOutlookMessage,
  refreshOutlookToken,
} from "./outlook";
import { subHours } from "date-fns";
import { getGmailMessageUrl, getOutlookMessageUrl } from "./urls";
import { senderMatchesBlocklist, type BlocklistEntry } from "./blocklist";

async function getValidAccessToken(account: {
  id: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
}) {
  const supabase = await createServiceClient();
  const expires = account.token_expires_at ? new Date(account.token_expires_at) : null;

  if (account.access_token && expires && expires > new Date()) {
    return account.access_token;
  }

  if (!account.refresh_token) return null;

  const tokens =
    account.provider === "gmail"
      ? await refreshGmailToken(account.refresh_token)
      : await refreshOutlookToken(account.refresh_token);

  if (!tokens.access_token) return null;

  await supabase
    .from("connected_accounts")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? account.refresh_token,
      token_expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    })
    .eq("id", account.id);

  return tokens.access_token as string;
}

export async function syncMailForUser(userId: string, sinceHours = 12) {
  const supabase = await createServiceClient();
  const since = subHours(new Date(), sinceHours);

  const { data: accounts } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId);

  if (!accounts?.length) return { synced: 0 };

  const { data: blocklist } = await supabase
    .from("sender_blocklist")
    .select("pattern, match_type")
    .eq("user_id", userId);

  const blocklistEntries = (blocklist ?? []) as BlocklistEntry[];

  let synced = 0;

  for (const account of accounts) {
    const token = await getValidAccessToken(account);
    if (!token) continue;

    const folderSettings = {
      inbox: account.scan_inbox,
      promotions: account.scan_promotions,
      junk: account.scan_junk,
    };

    const messages =
      account.provider === "gmail"
        ? await fetchGmailMessages(token, since, folderSettings)
        : await fetchOutlookMessages(token, since, folderSettings);

    for (const msg of messages) {
      const category =
        account.provider === "gmail"
          ? classifyGmailMessage(msg.subject, msg.from, msg.folder)
          : classifyOutlookMessage(msg.subject, msg.from, msg.folder);

      const webUrl =
        account.provider === "gmail"
          ? getGmailMessageUrl(msg.id)
          : ("webLink" in msg && msg.webLink) || getOutlookMessageUrl(msg.id);

      const blocked = senderMatchesBlocklist(msg.from, blocklistEntries);

      const row: Record<string, unknown> = {
        user_id: userId,
        source_type: account.provider,
        source_account_id: account.id,
        external_id: msg.id,
        title: msg.subject,
        summary: msg.snippet,
        url: webUrl,
        sender: msg.from,
        folder: msg.folder,
        category,
        received_at: msg.receivedAt,
      };
      if (blocked) row.priority = "dismissed";

      const { error } = await supabase.from("items").upsert(row, {
        onConflict: "user_id,source_type,external_id",
      });

      if (!error) synced++;
    }

    await supabase
      .from("connected_accounts")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", account.id);
  }

  return { synced };
}

export async function syncMailForAllUsers(sinceHours = 12) {
  const supabase = await createServiceClient();
  const { data: accounts } = await supabase.from("connected_accounts").select("user_id");
  const userIds = [...new Set((accounts ?? []).map((a) => a.user_id))];

  let total = 0;
  for (const userId of userIds) {
    const result = await syncMailForUser(userId, sinceHours);
    total += result.synced;
  }
  return { synced: total, users: userIds.length };
}
