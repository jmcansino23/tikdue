-- Tikdue: initial database setup
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Every table has Row Level Security: each user can only see and change
-- their own rows. Signed-out visitors (the "anon" role) get no access.

-- ---------------------------------------------------------------------------
-- Profiles: one row per user with their countries, currencies and reminder time
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  host_country   text,
  home_country   text,
  host_currency  char(3),
  home_currency  char(3),
  reminder_time  time not null default '08:00',
  time_zone      text not null default 'Asia/Muscat',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Items: bills and documents
-- ---------------------------------------------------------------------------
create table public.items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('bill', 'document')),
  name         text not null check (char_length(name) between 1 and 80),
  category     text,
  country      text check (country in ('host', 'home')),
  amount       numeric(14, 3) check (amount is null or amount >= 0),
  currency     char(3),
  repeat       text not null default 'monthly'
               check (repeat in ('monthly', 'quarterly', 'yearly', 'once')),
  due_day      smallint check (due_day between 1 and 31),
  next_due     date,           -- next due date (bills) or expiry date (documents)
  belongs_to   text,           -- documents: "Me", a family member, "Car"
  notes        text check (notes is null or char_length(notes) <= 500),
  paused       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index items_user_next_due on public.items (user_id, next_due);

-- ---------------------------------------------------------------------------
-- Payments: history of "Paid" / "Renewed" taps
-- ---------------------------------------------------------------------------
create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  due_date    date,            -- the due date this payment settled
  paid_on     date not null default current_date,
  amount      numeric(14, 3),
  created_at  timestamptz not null default now()
);

create index payments_item on public.payments (item_id, paid_on desc);
create index payments_user on public.payments (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.items    enable row level security;
alter table public.payments enable row level security;

create policy "own profile: read"   on public.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy "own profile: create" on public.profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own profile: update" on public.profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own items: read"   on public.items for select to authenticated using (user_id = (select auth.uid()));
create policy "own items: create" on public.items for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own items: update" on public.items for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own items: delete" on public.items for delete to authenticated using (user_id = (select auth.uid()));

create policy "own payments: read"   on public.payments for select to authenticated using (user_id = (select auth.uid()));
create policy "own payments: create" on public.payments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid()))
  );
create policy "own payments: delete" on public.payments for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Explicit access: signed-in users only; nothing for signed-out visitors
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.items, public.payments from anon;
grant select, insert, update          on public.profiles to authenticated;
grant select, insert, update, delete  on public.items    to authenticated;
grant select, insert, delete          on public.payments to authenticated;

-- ---------------------------------------------------------------------------
-- Keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger items_touch before update on public.items
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Create an empty profile automatically when someone signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
