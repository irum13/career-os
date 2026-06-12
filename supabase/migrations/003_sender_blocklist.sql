-- Auto-dismiss senders/domains/companies (run in Supabase SQL Editor)

create table if not exists public.sender_blocklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern text not null,
  match_type text not null check (match_type in ('email', 'domain', 'contains')),
  label text,
  created_at timestamptz default now(),
  unique (user_id, pattern, match_type)
);

alter table public.sender_blocklist enable row level security;

create policy "Users manage own blocklist" on public.sender_blocklist
  for all using (auth.uid() = user_id);
