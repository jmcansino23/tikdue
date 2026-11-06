-- Tikdue: reminders (push notifications)
-- Run once in Supabase: SQL Editor > New query > paste > Run.

-- One row per browser/phone that turned on reminders.
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint    text not null unique check (char_length(endpoint) <= 1000),
  p256dh      text not null check (char_length(p256dh) <= 200),
  auth        text not null check (char_length(auth) <= 100),
  created_at  timestamptz not null default now()
);

create index push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "own subscriptions: read"   on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy "own subscriptions: create" on public.push_subscriptions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own subscriptions: delete" on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.push_subscriptions from anon;
grant select, insert, delete on public.push_subscriptions to authenticated;

-- The daily reminder job runs with the secret key (service_role). It reads
-- everyone's due dates and subscriptions, and removes dead subscriptions.
grant usage on schema public to service_role;
grant select on public.profiles, public.items to service_role;
grant select, delete on public.push_subscriptions to service_role;
