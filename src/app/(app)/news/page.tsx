import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewsSourceManager } from "@/components/NewsSourceManager";
import { GenerateBriefButton } from "@/components/GenerateBriefButton";
import { OpenMailLink } from "@/components/OpenMailLink";
import { addNewsSourceFromForm } from "@/app/actions";
import { FormField, SubmitButton } from "@/components/forms/SimpleForm";
import { filterNewsItems, getLatestNewsBrief } from "@/lib/news-brief";
import { formatDateTime } from "@/lib/utils";
import type { Item, NewsBriefIdea } from "@/lib/types";

export default async function NewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: newsSources } = await supabase
    .from("news_sources")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user!.id)
    .neq("priority", "dismissed")
    .order("received_at", { ascending: false })
    .limit(100);

  const newsItems = filterNewsItems(
    (items ?? []) as Item[],
    (newsSources ?? []).map((s) => ({ pattern: s.pattern, match_type: s.match_type }))
  ).slice(0, 20);

  const latestBrief = await getLatestNewsBrief(user!.id);
  const ideas = (latestBrief?.ideas_json ?? []) as NewsBriefIdea[];

  return (
    <div>
      <Header
        title="News"
        subtitle="Curated AI and tech newsletters — full-body summaries and career ideas"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            title="Latest brief"
            action={newsSources?.length ? <GenerateBriefButton /> : null}
          >
            {latestBrief ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--muted)]">
                  Generated {formatDateTime(latestBrief.generated_at)}
                </p>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
                    {latestBrief.summary_text}
                  </p>
                </div>
                {ideas.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Career ideas</p>
                    <ul className="space-y-3">
                      {ideas.map((idea, index) => (
                        <li key={index} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                          <p className="font-medium text-slate-900">{idea.title}</p>
                          <p className="mt-1 text-slate-600">{idea.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : newsSources?.length ? (
              <EmptyState
                title="No brief yet"
                description="Sync mail from Settings, or click Generate brief after adding news sources."
              />
            ) : (
              <EmptyState
                title="Add your first news source"
                description="Mark newsletter senders below or from Inbox to start receiving AI briefs."
              />
            )}
          </Card>

          <Card title="Recent newsletters">
            {newsItems.length > 0 ? (
              <ul className="space-y-3">
                {newsItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {item.sender} · {formatDateTime(item.received_at)}
                      </p>
                    </div>
                    <OpenMailLink
                      sourceType={item.source_type}
                      externalId={item.external_id ?? ""}
                      url={item.url}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No newsletter mail yet"
                description="Add news sources and sync mail. Gmail full-body reading is supported."
              />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="News sources">
            <p className="mb-4 text-sm text-[var(--muted)]">
              Mail from these senders is read in full and included in your AI brief.
            </p>
            <NewsSourceManager entries={newsSources ?? []} />
            <form action={addNewsSourceFromForm} className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
              <FormField
                label="Email, domain, or sender name"
                name="pattern"
                required
                placeholder="e.g. tldrnewsletter.com, TLDR AI"
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Match type</label>
                <select
                  name="match_type"
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="">Auto-detect</option>
                  <option value="email">Exact email</option>
                  <option value="domain">Domain</option>
                  <option value="contains">Contains</option>
                </select>
              </div>
              <SubmitButton label="Add source" />
            </form>
          </Card>

          <Card title="Tips">
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>Use Inbox → Add to News on any newsletter.</li>
              <li>Sync mail from Settings after adding sources.</li>
              <li>Briefs auto-generate when new news mail arrives.</li>
            </ul>
            <Link href="/settings" className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline">
              Open Settings →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
