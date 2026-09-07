-- Migration: Add feedback_views table for tracking seen feedback
-- Safe to apply in Supabase SQL editor or via `supabase db push`.

-- ------------------------------------------------------------
-- Feedback views (tracks which users have seen which feedback)
-- ------------------------------------------------------------
create table if not exists public.feedback_views (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (feedback_id, user_id)
);

create index if not exists feedback_views_user_idx on public.feedback_views(user_id);
create index if not exists feedback_views_feedback_idx on public.feedback_views(feedback_id);

-- Enable RLS
alter table public.feedback_views enable row level security;

-- Users can only view their own feedback_views
create policy "feedback_views_select_own" on public.feedback_views
  for select
  using (auth.uid() = user_id);

-- Users can insert their own feedback_views
create policy "feedback_views_insert_own" on public.feedback_views
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own feedback_views
create policy "feedback_views_update_own" on public.feedback_views
  for update
  using (auth.uid() = user_id);

-- Allow authenticated role to read/write (policies still apply)
grant select, insert, update on public.feedback_views to authenticated;
revoke delete on public.feedback_views from authenticated;
grant delete on public.feedback_views to service_role;