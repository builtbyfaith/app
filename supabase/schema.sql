-- Built by Faith app database. Paste this whole file into Supabase: SQL Editor > New query > Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text default '',
  setup jsonb,
  settings jsonb default '{}'::jsonb,
  progression jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'none',            -- none | core | coach
  status text,                                  -- trialing | active | past_due | canceled
  stripe_customer_id text unique,
  current_period_end timestamptz,
  had_trial boolean default false
);

create table if not exists public.workout_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  name text, program text, energy text, effort text, minutes int,
  exercises jsonb,
  created_at timestamptz default now()
);
create index if not exists workout_logs_user_date on public.workout_logs(user_id, date);

create table if not exists public.daily_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  steps int,
  meals jsonb,
  primary key (user_id, date)
);

create table if not exists public.body_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric,
  primary key (user_id, date)
);

create table if not exists public.coach_messages (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);
create index if not exists coach_messages_user_time on public.coach_messages(user_id, created_at);

-- New sign-ups get a profile and an empty subscription row automatically
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
    on conflict (id) do nothing;
  insert into public.subscriptions (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security: members can only see and change their own data.
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.workout_logs enable row level security;
alter table public.daily_logs enable row level security;
alter table public.body_logs enable row level security;
alter table public.coach_messages enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Members can read their plan but only the server (Stripe webhook) can change it
drop policy if exists "own subscription read" on public.subscriptions;
create policy "own subscription read" on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists "own workouts" on public.workout_logs;
create policy "own workouts" on public.workout_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own daily" on public.daily_logs;
create policy "own daily" on public.daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own body" on public.body_logs;
create policy "own body" on public.body_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Members can read their coach chat; only the server writes it (so daily limits can't be skipped)
drop policy if exists "own coach read" on public.coach_messages;
create policy "own coach read" on public.coach_messages for select using (auth.uid() = user_id);
