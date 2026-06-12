import { subDays } from "date-fns";
import { createServiceClient } from "@/lib/supabase/server";
import { generateNewsBriefContent } from "@/lib/gemini";
import { senderMatchesNewsSources, type NewsSourceEntry } from "@/lib/mail/news-sources";
import type { Item, NewsBrief, Profile } from "@/lib/types";

const MAX_ITEMS = 15;
const LOOKBACK_DAYS = 7;

export async function getNewsSourceEntries(userId: string): Promise<NewsSourceEntry[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("news_sources")
    .select("pattern, match_type")
    .eq("user_id", userId);
  return (data ?? []) as NewsSourceEntry[];
}

export function filterNewsItems(items: Item[], entries: NewsSourceEntry[]): Item[] {
  if (!entries.length) return [];
  return items.filter((item) => senderMatchesNewsSources(item.sender, entries));
}

export async function fetchNewsItemsForBrief(userId: string): Promise<Item[]> {
  const supabase = await createServiceClient();
  const entries = await getNewsSourceEntries(userId);
  if (!entries.length) return [];

  const since = subDays(new Date(), LOOKBACK_DAYS).toISOString();
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .neq("priority", "dismissed")
    .gte("received_at", since)
    .order("received_at", { ascending: false })
    .limit(100);

  return filterNewsItems((items ?? []) as Item[], entries)
    .filter((item) => item.body_text || item.summary)
    .slice(0, MAX_ITEMS);
}

export async function getLatestNewsBrief(userId: string): Promise<NewsBrief | null> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("news_briefs")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as NewsBrief | null;
}

export async function generateNewsBrief(userId: string): Promise<NewsBrief | null> {
  const supabase = await createServiceClient();
  const items = await fetchNewsItemsForBrief(userId);
  if (!items.length) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { summary, ideas } = await generateNewsBriefContent(
    items,
    profile as Profile | null
  );

  const { data: brief } = await supabase
    .from("news_briefs")
    .insert({
      user_id: userId,
      summary_text: summary,
      ideas_json: ideas,
      item_ids: items.map((i) => i.id),
    })
    .select()
    .single();

  return brief as NewsBrief | null;
}

export async function shouldAutoGenerateBrief(
  userId: string,
  syncedNewsCount: number
): Promise<boolean> {
  if (syncedNewsCount === 0) return false;

  const entries = await getNewsSourceEntries(userId);
  if (!entries.length) return false;

  const latest = await getLatestNewsBrief(userId);
  if (!latest) return true;

  const since = new Date(latest.generated_at);
  const items = await fetchNewsItemsForBrief(userId);
  return items.some((item) => new Date(item.received_at) > since);
}
