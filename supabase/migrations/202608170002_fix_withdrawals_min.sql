-- ============================================================
-- CoinQuest - fix: withdrawals.min_amount was left at the old
-- default (10) on live because the setting was added to the
-- feature migration after it was already pushed.
-- ============================================================

insert into public.admin_settings (key, value)
values ('withdrawals', '{"min_amount": 1000}')
on conflict (key) do update
  set value = excluded.value, updated_at = now();