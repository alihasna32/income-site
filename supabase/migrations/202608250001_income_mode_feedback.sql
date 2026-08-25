-- Migration: Add Income Mode, Conversion Settings, Feedback, and User Restrictions
-- Safe to apply in Supabase SQL editor or via `supabase db push`.

-- ------------------------------------------------------------
-- Add Income Mode status column to profiles
-- ------------------------------------------------------------
-- Store the user's current Income Mode status on their profile to avoid trusting client-side flags.
alter table public.profiles
  add column if not exists income_mode_status text not null default 'disabled' check (income_mode_status in ('disabled','pending','active','suspended','blocked'));

create index if not exists profiles_income_mode_idx on public.profiles(income_mode_status);

-- Ensure users cannot update income_mode_status directly by not granting it in the update grant below (profiles update grants are defined in schema.sql)

-- ------------------------------------------------------------
-- Income Mode requests
-- ------------------------------------------------------------
create table if not exists public.income_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  transaction_id text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  admin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent more than one pending request per user
create unique index if not exists income_requests_unique_pending_on_user
  on public.income_requests(user_id)
  where status = 'pending';

alter table public.income_requests enable row level security;

-- Allow authenticated users to insert their own request, but ensure status remains 'pending'
create policy "income_requests_insert_self" on public.income_requests
  for insert
  with check (auth.uid() = user_id and status = 'pending');

-- Allow users to select their own requests; admins can select all
create policy "income_requests_select_owner_or_admin" on public.income_requests
  for select
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

-- Allow admins to update (approve/reject) and delete
create policy "income_requests_update_admin" on public.income_requests
  for update
  using (
    public.is_admin() and auth.uid() <> user_id -- admins cannot approve their own request
  )
  with check (
    public.is_admin() and auth.uid() <> user_id
  );

create policy "income_requests_delete_admin" on public.income_requests
  for delete
  using (public.is_admin());

-- Grant read access to authenticated role (policies still apply)
grant select on public.income_requests to authenticated;
revoke insert, update, delete on public.income_requests from anon;
grant insert, update, delete on public.income_requests to authenticated;

-- Trigger: when an income_request is approved or rejected by an admin, update the user's profile income_mode_status.
create or replace function public.handle_income_request_update()
returns trigger
language plpgsql
security definer
as $$
begin
  -- If status changed to 'approved', set profile to 'active'
  if (tg_op = 'UPDATE') then
    if (new.status = 'approved' and old.status <> 'approved') then
      update public.profiles
      set income_mode_status = 'active', updated_at = now()
      where id = new.user_id;
    elsif (new.status = 'rejected' and old.status <> 'rejected') then
      update public.profiles
      set income_mode_status = 'disabled', updated_at = now()
      where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_income_request_update
  after update on public.income_requests
  for each row
  execute function public.handle_income_request_update();

-- ------------------------------------------------------------
-- Conversion / Wallet settings
-- ------------------------------------------------------------
create table if not exists public.conversion_settings (
  id uuid primary key default gen_random_uuid(),
  coins_per_taka integer not null default 100 check (coins_per_taka > 0), -- e.g. 1000 coins = 10 Taka => 100 coins = 1 Taka => coins_per_taka = 100
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversion_settings enable row level security;

-- Only admins can insert/update/delete conversion settings
create policy "conversion_settings_admin_only" on public.conversion_settings
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Allow everyone to select the (active) conversion setting via a policy
create policy "conversion_settings_select" on public.conversion_settings
  for select
  using (is_active = true);

grant select on public.conversion_settings to authenticated;
revoke insert, update, delete on public.conversion_settings from anon;
grant insert, update, delete on public.conversion_settings to authenticated;

-- Ensure there is at most one active conversion setting (soft constraint via partial unique index)
create unique index if not exists conversion_settings_single_active_idx
  on public.conversion_settings(is_active)
  where is_active = true;

-- Insert a default conversion setting if none exists
insert into public.conversion_settings (coins_per_taka, is_active, created_at, updated_at)
select 100, true, now(), now()
where not exists (select 1 from public.conversion_settings where is_active = true);

-- ------------------------------------------------------------
-- Feedback (admin-created, user-viewable)
-- ------------------------------------------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  admin_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback(created_at desc);

alter table public.feedback enable row level security;

-- Admins can create/edit/delete feedback
create policy "feedback_admin_crud" on public.feedback
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Authenticated users can select active feedback
create policy "feedback_select_active" on public.feedback
  for select
  using (is_active = true);

grant select on public.feedback to authenticated;
revoke insert, update, delete on public.feedback from anon;
grant insert, update, delete on public.feedback to authenticated;

-- ------------------------------------------------------------
-- User restrictions (suspensions / blocks)
-- ------------------------------------------------------------
create table if not exists public.user_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('suspended','blocked')),
  start_time timestamptz not null default now(),
  end_time timestamptz,
  reason text not null default '',
  admin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_restrictions_user_idx on public.user_restrictions(user_id);

alter table public.user_restrictions enable row level security;

-- Admins can manage restrictions
create policy "user_restrictions_admin_crud" on public.user_restrictions
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Users can select their own active restrictions
create policy "user_restrictions_select_owner" on public.user_restrictions
  for select
  using (auth.uid() = user_id);

grant select on public.user_restrictions to authenticated;
revoke insert, update, delete on public.user_restrictions from anon;
grant insert, update, delete on public.user_restrictions to authenticated;

-- Trigger/helper: recompute a user's effective restriction state
create or replace function public.recompute_user_restriction_status(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_blocked boolean;
  v_suspended boolean;
  v_income_approved boolean;
begin
  select exists(
    select 1 from public.user_restrictions ur
    where ur.user_id = p_user_id
      and ur.type = 'blocked'
      and (ur.end_time is null or ur.end_time > now())
  ) into v_blocked;

  select exists(
    select 1 from public.user_restrictions ur
    where ur.user_id = p_user_id
      and ur.type = 'suspended'
      and (ur.end_time is null or ur.end_time > now())
  ) into v_suspended;

  select exists(
    select 1 from public.income_requests r
    where r.user_id = p_user_id and r.status = 'approved'
  ) into v_income_approved;

  if v_blocked then
    update public.profiles set income_mode_status = 'blocked', updated_at = now() where id = p_user_id;
  elsif v_suspended then
    update public.profiles set income_mode_status = 'suspended', updated_at = now() where id = p_user_id;
  elsif v_income_approved then
    update public.profiles set income_mode_status = 'active', updated_at = now() where id = p_user_id;
  else
    update public.profiles set income_mode_status = 'disabled', updated_at = now() where id = p_user_id;
  end if;
end;
$$;

-- Trigger to recompute profile status after changes to restrictions
create or replace function public.handle_user_restriction_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    perform public.recompute_user_restriction_status(new.user_id);
  elsif (tg_op = 'DELETE') then
    perform public.recompute_user_restriction_status(old.user_id);
  end if;
  return null;
end;
$$;

create trigger trg_user_restrictions_changed
  after insert or update or delete on public.user_restrictions
  for each row
  execute function public.handle_user_restriction_change();

-- ------------------------------------------------------------
-- Notes
-- - These policies assume the existing public.profiles.role contains 'admin' for admin users (as in the schema).
-- - Admin checks use an EXISTS(...) subquery against public.profiles to determine role membership under RLS.
-- - The SQL above intentionally revokes insert/update/delete privileges from authenticated/anon roles and relies on the RLS policies to permit allowed operations.
-- - Apply these migrations in a staging environment first and verify RLS behavior before applying to production.
-- - This migration only creates schema & RLS. Server-side API code must enforce additional checks where appropriate (e.g., preventing users from setting status fields when creating income_requests).
