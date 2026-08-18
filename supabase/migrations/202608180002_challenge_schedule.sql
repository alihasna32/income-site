-- ============================================================
-- CoinQuest — daily challenge schedule (auto-generated upcoming challenges)
-- Runs AFTER 202608180001_contact_messages.sql.
-- ============================================================

create table public.challenge_schedule (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  scheduled_for date not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed')),
  created_at timestamptz not null default now(),
  unique (challenge_id, scheduled_for)
);

create index challenge_schedule_date_idx on public.challenge_schedule(scheduled_for);

alter table public.challenge_schedule enable row level security;

-- The schedule is a public catalog (challenge ids + dates, no answers).
create policy "challenge_schedule_read" on public.challenge_schedule
  for select using (true);

revoke insert, update, delete on public.challenge_schedule from authenticated, anon;
grant select on public.challenge_schedule to authenticated, anon;
