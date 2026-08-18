-- ============================================================
-- CoinQuest — enable Supabase Realtime for notifications
-- Runs AFTER 202608180002_challenge_schedule.sql.
-- Realtime respects RLS, so users only receive their own rows.
-- ============================================================

alter publication supabase_realtime add table public.notifications;