-- ============================================================
-- CoinQuest — contact messages (contact form persistence + admin panel)
-- Runs AFTER 202608170005_fix_profiles_policy.sql.
-- ============================================================

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  admin_note text not null default '',
  created_at timestamptz not null default now()
);

create index contact_messages_created_idx on public.contact_messages(created_at desc);
create index contact_messages_status_idx on public.contact_messages(status, created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone (logged in or not) can submit a message; the API attaches user_id.
create policy "contact_messages_insert" on public.contact_messages
  for insert to anon, authenticated with check (true);

-- Users can read their own submissions; admins can read everything.
create policy "contact_messages_select_own" on public.contact_messages
  for select using (auth.uid() = user_id or public.is_admin());

-- Only admins (via API/service role) update status/notes.
revoke update, delete on public.contact_messages from authenticated, anon;
grant select, insert on public.contact_messages to authenticated;
grant insert on public.contact_messages to anon;
