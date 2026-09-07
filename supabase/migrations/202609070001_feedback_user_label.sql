-- Migration: Add user_label to feedback (the display name shown to users)
--
-- The feedback popup shows an "author" name. Rather than leaking the real
-- admin's display name, admins now set a public-facing label (e.g.
-- "User 1", "User 2") that is what users see. The label is shown to
-- everyone but never resolves to a real user account.
--
-- Safe to apply via `supabase db push` or in the Supabase SQL editor.

alter table public.feedback
  add column if not exists user_label text;

-- Backfill existing rows with deterministic labels so nothing appears empty.
-- The numbering follows created_at ascending so the oldest row is "User 1".
do $$
declare
  rec record;
  idx int := 1;
begin
  for rec in
    select id from public.feedback order by created_at asc
  loop
    update public.feedback
      set user_label = 'User ' || idx
      where id = rec.id and (user_label is null or user_label = '');
    idx := idx + 1;
  end loop;
end $$;
