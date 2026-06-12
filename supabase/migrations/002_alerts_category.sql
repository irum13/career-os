-- Add "alerts" category for job alerts (run in Supabase SQL Editor)

alter table public.items drop constraint if exists items_category_check;

alter table public.items add constraint items_category_check
  check (category in ('newsletter', 'job_alert', 'ai_news', 'other', 'alerts'));

-- Migrate existing job alerts to new category
update public.items set category = 'alerts' where category = 'job_alert';
