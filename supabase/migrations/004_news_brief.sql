-- Curated newsletter / AI news senders
create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern text not null,
  match_type text not null default 'contains' check (match_type in ('email', 'domain', 'contains')),
  label text,
  created_at timestamptz default now(),
  unique (user_id, pattern, match_type)
);

alter table public.news_sources enable row level security;

create policy "Users manage own news sources" on public.news_sources
  for all using (auth.uid() = user_id);

-- Generated AI news briefs
create table if not exists public.news_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary_text text not null,
  ideas_json jsonb default '[]',
  item_ids uuid[] default '{}',
  generated_at timestamptz default now()
);

create index news_briefs_user_generated_idx on public.news_briefs(user_id, generated_at desc);

alter table public.news_briefs enable row level security;

create policy "Users manage own news briefs" on public.news_briefs
  for all using (auth.uid() = user_id);

-- Full email body for news-source messages only
alter table public.items add column if not exists body_text text;
