-- Reselldock database schema for Supabase (Postgres)
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('reseller','business')),
  business_name text,
  stripe_account_id text,
  stripe_onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  category text not null default 'General',
  description text not null default '',
  quantity text not null default '',
  condition text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists interests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  reseller_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(listing_id, reseller_id)
);

create table if not exists partnerships (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references profiles(id) on delete cascade,
  business_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(reseller_id, business_id)
);

create table if not exists threads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references profiles(id) on delete cascade,
  reseller_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(business_id, reseller_id, listing_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  type text not null default 'text' check (type in ('text','system','offer')),
  body text,
  offer_amount numeric,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references threads(id) on delete set null,
  message_id uuid references messages(id) on delete set null,
  business_id uuid not null references profiles(id),
  reseller_id uuid not null references profiles(id),
  amount numeric not null,
  fee_amount numeric not null,
  net_amount numeric not null,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz not null default now()
);

-- ============ Row Level Security ============
-- (drop-then-create below makes this script safe to re-run if it partially failed before)
alter table profiles enable row level security;
alter table listings enable row level security;
alter table interests enable row level security;
alter table partnerships enable row level security;
alter table threads enable row level security;
alter table messages enable row level security;
alter table payments enable row level security;

-- profiles: anyone signed in can view profiles (needed to show business names on listings),
-- but you can only edit your own row.
create policy "profiles are viewable by authenticated users" on profiles
  for select using (auth.role() = 'authenticated');
create policy "users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- listings: readable by anyone signed in; only the owning business can create/edit/delete.
create policy "listings are viewable by authenticated users" on listings
  for select using (auth.role() = 'authenticated');
create policy "businesses can insert their own listings" on listings
  for insert with check (auth.uid() = business_id);
create policy "businesses can update their own listings" on listings
  for update using (auth.uid() = business_id);
create policy "businesses can delete their own listings" on listings
  for delete using (auth.uid() = business_id);

-- interests: a reseller can create/manage their own; the "N interested" count on a
-- listing is a public forum-style stat, so counting/reading rows is open to any
-- signed-in user (writes are still locked to the owning reseller below).
create policy "interests are viewable by authenticated users" on interests
  for select using (auth.role() = 'authenticated');
create policy "resellers manage their own interests" on interests
  for all using (auth.uid() = reseller_id) with check (auth.uid() = reseller_id);

-- partnerships: same idea — the "N partners" count needs to be publicly readable;
-- only the reseller who owns a given follow relationship can create/remove it.
create policy "partnerships are viewable by authenticated users" on partnerships
  for select using (auth.role() = 'authenticated');
create policy "resellers manage their own partnerships" on partnerships
  for all using (auth.uid() = reseller_id) with check (auth.uid() = reseller_id);

-- threads: visible/insertable only to the two participants.
create policy "participants can view their threads" on threads
  for select using (auth.uid() = business_id or auth.uid() = reseller_id);
create policy "participants can create threads" on threads
  for insert with check (auth.uid() = business_id or auth.uid() = reseller_id);

-- messages: visible/insertable only to participants of the parent thread.
create policy "participants can view messages" on messages
  for select using (exists (
    select 1 from threads t where t.id = thread_id
    and (t.business_id = auth.uid() or t.reseller_id = auth.uid())
  ));
create policy "participants can send messages" on messages
  for insert with check (exists (
    select 1 from threads t where t.id = thread_id
    and (t.business_id = auth.uid() or t.reseller_id = auth.uid())
  ));

-- payments: visible to the two parties involved; writes happen via the server (service role) only.
create policy "participants can view their payments" on payments
  for select using (auth.uid() = business_id or auth.uid() = reseller_id);
