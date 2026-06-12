import { createClient } from "@/lib/supabase/server";

import { Header } from "@/components/layout/Header";

import { EmptyState } from "@/components/ui/EmptyState";

import { InboxFilters } from "@/components/InboxFilters";

import { InboxList } from "@/components/InboxList";



export default async function InboxPage({

  searchParams,

}: {

  searchParams: Promise<{ filter?: string }>;

}) {

  const { filter: rawFilter } = await searchParams;

  const filter = rawFilter ?? "all";

  const supabase = await createClient();

  const {

    data: { user },

  } = await supabase.auth.getUser();



  let query = supabase

    .from("items")

    .select("*")

    .eq("user_id", user!.id)

    .neq("priority", "dismissed")

    .order("received_at", { ascending: false })

    .limit(100);



  if (filter === "review") {

    query = query.eq("priority", "unclassified").in("folder", ["promotions", "junk"]);

  } else if (filter === "alerts") {

    query = query.in("category", ["alerts", "job_alert"]);

  } else if (filter === "high" || filter === "medium" || filter === "low") {

    query = query.eq("priority", filter);

  } else if (filter === "ai_news" || filter === "newsletter") {

    query = query.eq("category", filter);

  }



  const { data: items } = await query;



  const subtitles: Record<string, string> = {

    all: "Unified feed from Gmail, Outlook, and manual saves",

    high: "Items you marked high priority — work on these first",

    medium: "Items to revisit this week",

    low: "Skim when you have time",

    alerts: "Job alerts from Updates, Social, Inbox, and Promotions",

    review: "Classify promotions and junk mail by priority",

    ai_news: "AI and tech newsletters",

    newsletter: "Newsletters and digests",

  };



  return (

    <div>

      <Header title="Inbox" subtitle={subtitles[filter] ?? subtitles.all} />



      <InboxFilters active={filter} />



      {items && items.length > 0 ? (

        <InboxList items={items} />

      ) : (

        <EmptyState

          title="Inbox is empty"

          description={

            filter === "high" || filter === "medium" || filter === "low"

              ? `No items marked ${filter} priority yet.`

              : "Connect Gmail and Outlook in Sources, or use Quick Capture to save links manually."

          }

        />

      )}

    </div>

  );

}

