-- Career OS initial schema
-- Run in Supabase SQL Editor or via supabase CLI

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  location text default 'Houston, TX',
  timezone text default 'America/Chicago',
  status text default 'International graduate student',
  school text default 'University of Houston (UH)',
  program text default 'Engineering Data Science',
  career_focus text default 'jobs, fellowships, scholarships, networking',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Connected mail accounts
create table if not exists public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gmail', 'outlook')),
  email text not null,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scan_inbox boolean default true,
  scan_promotions boolean default true,
  scan_junk boolean default true,
  last_sync_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, provider)
);

alter table public.connected_accounts enable row level security;
create policy "Users manage own accounts" on public.connected_accounts
  for all using (auth.uid() = user_id);

-- Sources (websites/channels — for later)
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text,
  fetch_method text default 'manual' check (fetch_method in ('rss', 'ics', 'scrape', 'manual')),
  enabled boolean default true,
  last_sync_at timestamptz,
  created_at timestamptz default now()
);

alter table public.sources enable row level security;
create policy "Users manage own sources" on public.sources
  for all using (auth.uid() = user_id);

-- Unified inbox items
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('gmail', 'outlook', 'manual', 'rss', 'reddit', 'github')),
  source_account_id uuid references public.connected_accounts(id) on delete set null,
  external_id text,
  title text not null,
  summary text,
  url text,
  sender text,
  folder text,
  category text default 'other' check (category in ('newsletter', 'job_alert', 'ai_news', 'other')),
  priority text default 'unclassified' check (priority in ('unclassified', 'high', 'medium', 'low', 'dismissed')),
  received_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, source_type, external_id)
);

create index items_user_priority_idx on public.items(user_id, priority);
create index items_user_received_idx on public.items(user_id, received_at desc);

alter table public.items enable row level security;
create policy "Users manage own items" on public.items
  for all using (auth.uid() = user_id);

-- Deadlines (polymorphic via entity_type + entity_id)
create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date not null,
  notice_days int[] default '{7,3,1}',
  entity_type text check (entity_type in ('job', 'scholarship', 'work', 'subscription', 'event', 'other')),
  entity_id uuid,
  notes text,
  created_at timestamptz default now()
);

alter table public.deadlines enable row level security;
create policy "Users manage own deadlines" on public.deadlines
  for all using (auth.uid() = user_id);

-- Job applications
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  status text default 'interested' check (status in ('interested', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  url text,
  notes text,
  applied_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.job_applications enable row level security;
create policy "Users manage own jobs" on public.job_applications
  for all using (auth.uid() = user_id);

-- Scholarships
create table if not exists public.scholarships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  organization text,
  status text default 'interested' check (status in ('interested', 'applied', 'awarded', 'rejected', 'withdrawn')),
  url text,
  amount text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.scholarships enable row level security;
create policy "Users manage own scholarships" on public.scholarships
  for all using (auth.uid() = user_id);

-- Subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(10,2),
  renewal_date date,
  cancel_url text,
  notes text,
  created_at timestamptz default now()
);

alter table public.subscriptions enable row level security;
create policy "Users manage own subscriptions" on public.subscriptions
  for all using (auth.uid() = user_id);

-- Contacts
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  context text,
  last_contacted date,
  follow_up_date date,
  chat_questions text,
  notes text,
  created_at timestamptz default now()
);

alter table public.contacts enable row level security;
create policy "Users manage own contacts" on public.contacts
  for all using (auth.uid() = user_id);

-- Digests
create table if not exists public.digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  digest_type text not null check (digest_type in ('am', 'pm', 'weekly', 'monthly')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  trending_summary text,
  content_json jsonb default '{}',
  read_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, digest_type, period_start)
);

alter table public.digests enable row level security;
create policy "Users manage own digests" on public.digests
  for all using (auth.uid() = user_id);

-- Alerts (deadline shoutouts)
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deadline_id uuid references public.deadlines(id) on delete cascade,
  alert_type text not null,
  message text not null,
  days_before int,
  read_at timestamptz,
  created_at timestamptz default now(),
  unique (deadline_id, days_before)
);

alter table public.alerts enable row level security;
create policy "Users manage own alerts" on public.alerts
  for all using (auth.uid() = user_id);

-- Action requests (approve-before-execute)
create table if not exists public.action_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('draft_application', 'calendar_add', 'other')),
  title text not null,
  request_text text,
  draft_content text,
  status text default 'drafting' check (status in ('drafting', 'pending_approval', 'approved', 'executed', 'cancelled')),
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.action_requests enable row level security;
create policy "Users manage own actions" on public.action_requests
  for all using (auth.uid() = user_id);

-- Sync cursors per account/folder
create table if not exists public.sync_cursors (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.connected_accounts(id) on delete cascade,
  folder text not null,
  last_sync_at timestamptz default now(),
  unique (account_id, folder)
);

alter table public.sync_cursors enable row level security;
create policy "Users manage own sync cursors" on public.sync_cursors
  for all using (
    account_id in (select id from public.connected_accounts where user_id = auth.uid())
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
