-- Migration: Taka wallet, coin->taka conversion, and Taka withdrawal requests
-- Adds:
--   * wallets.taka_balance (and total_taka_withdrawn) for the converted money balance
--   * public.taka_transactions — append-only audit log of every taka movement
--   * public.taka_withdrawals — withdrawal requests in Taka (separate from existing
--     coin-based `withdrawals` table; the existing coin flow stays untouched)
--   * public.convert_coins_to_taka(p_user_id, p_coins, p_min_coins, p_rate) —
--     atomic RPC that subtracts coins, adds taka, and writes both transaction
--     records in a single transaction
--   * public.get_taka_conversion_min() helper so the API and RPC agree on the
--     current minimum conversion threshold
--
-- Apply in Supabase SQL editor or via `supabase db push`.
-- Safe to apply to a DB that already has rows in `wallets` (default 0 taka_balance).

-- ------------------------------------------------------------
-- 1. Add taka columns to wallets
-- ------------------------------------------------------------
alter table public.wallets
  add column if not exists taka_balance integer not null default 0 check (taka_balance >= 0),
  add column if not exists total_taka_withdrawn integer not null default 0 check (total_taka_withdrawn >= 0);

-- ------------------------------------------------------------
-- 2. Taka transactions (audit trail, never user-writable)
-- ------------------------------------------------------------
create table if not exists public.taka_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'coin_conversion',    -- +taka when coins are converted
    'taka_withdrawal',    -- -taka when a withdrawal request is approved
    'adjustment'          -- manual admin adjustment
  )),
  amount integer not null check (amount <> 0),  -- positive = credit, negative = debit
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'reversed')),
  description text not null default '',
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists taka_transactions_idem_idx
  on public.taka_transactions(user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists taka_transactions_user_created_idx
  on public.taka_transactions(user_id, created_at desc);

alter table public.taka_transactions enable row level security;

-- Users can read their own taka transaction history; admins can read all.
create policy "taka_transactions_select_owner_or_admin"
  on public.taka_transactions
  for select
  using (auth.uid() = user_id or public.is_admin());

-- No client-role grants for write — all writes happen via service_role / RPC.
revoke insert, update, delete on public.taka_transactions from anon, authenticated;

-- ------------------------------------------------------------
-- 3. Taka withdrawal requests
-- ------------------------------------------------------------
create table if not exists public.taka_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),   -- amount in Taka (whole units)
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'completed')),
  method text not null check (method in ('bank_transfer', 'mobile_wallet', 'paypal')),
  details jsonb not null default '{}'::jsonb,
  admin_note text not null default '',
  processed_by uuid references public.profiles(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Only one pending taka withdrawal per user at a time
create unique index if not exists taka_withdrawals_one_pending_idx
  on public.taka_withdrawals(user_id)
  where status = 'pending';

create index if not exists taka_withdrawals_user_created_idx
  on public.taka_withdrawals(user_id, created_at desc);

alter table public.taka_withdrawals enable row level security;

-- Users can read their own requests; admins can read/update all
create policy "taka_withdrawals_select_owner_or_admin"
  on public.taka_withdrawals
  for select
  using (auth.uid() = user_id or public.is_admin());

create policy "taka_withdrawals_update_admin"
  on public.taka_withdrawals
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- No client-side inserts/updates/deletes — always go through service_role / RPC.
revoke insert, update, delete on public.taka_withdrawals from anon, authenticated;

-- ------------------------------------------------------------
-- 4. Min-conversion setting (used by RPC and API)
-- ------------------------------------------------------------
-- Stored as an admin_settings key, but we also expose a tiny helper so the
-- RPC and the API read the same value without duplicating JSONB queries.
create or replace function public.get_taka_conversion_min()
returns integer
language sql
stable
security definer
as $$
  select coalesce(
    (
      select (value->>'min_coins')::int
      from public.admin_settings
      where key = 'taka_conversion'
      limit 1
    ),
    1000
  );
$$;

grant execute on function public.get_taka_conversion_min() to service_role;

-- ------------------------------------------------------------
-- 5. Atomic coin -> taka conversion RPC
-- ------------------------------------------------------------
-- Inputs:
--   p_user_id     - the authenticated user (caller MUST be service_role)
--   p_coins       - amount of coins to convert (positive integer)
--   p_min_coins   - server-validated minimum (defaults to admin setting)
--   p_rate        - coins-per-taka (the active conversion rate at fetch time)
--
-- Returns a json object:
--   { ok: true, new_coin_balance, new_taka_balance, taka_credited, conversion_id }
-- or throws a descriptive error which the API surfaces to the client.
create or replace function public.convert_coins_to_taka(
  p_user_id uuid,
  p_coins integer,
  p_min_coins integer default null,
  p_rate integer default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_min integer := coalesce(p_min_coins, public.get_taka_conversion_min());
  v_rate integer := coalesce(p_rate, 100);
  v_coins integer := p_coins;
  v_taka integer;
  v_wallet record;
  v_idem_key text;
  v_conv_id uuid;
begin
  -- Basic input validation
  if p_user_id is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;
  if v_coins is null or v_coins <= 0 then
    raise exception 'Enter a positive coin amount' using errcode = '22023';
  end if;
  if v_coins < v_min then
    raise exception 'Minimum conversion is % coins', v_min using errcode = '22023';
  end if;
  if v_rate is null or v_rate <= 0 then
    raise exception 'Invalid conversion rate' using errcode = '22023';
  end if;

  -- Taka credited (integer, floored). With rate=100: 1000 coins -> 10 taka, 2500 -> 25 taka, 5000 -> 50 taka.
  v_taka := v_coins / v_rate;

  if v_taka <= 0 then
    raise exception 'Conversion yields 0 taka — increase the coin amount' using errcode = '22023';
  end if;

  -- Idempotency key (stable per user+amount+minute window so retried POSTs
  -- within the same minute collapse into one conversion)
  v_idem_key := 'coin_to_taka:' || p_user_id::text || ':' || v_coins::text || ':' ||
                to_char(now() at time zone 'utc', 'YYYYMMDDHH24MI');

  -- Lock the user's wallet row for the duration of the transaction
  select coins, taka_balance into v_wallet
    from public.wallets
   where user_id = p_user_id
   for update;

  if not found then
    raise exception 'Wallet not found for user' using errcode = 'P0002';
  end if;

  if v_wallet.coins < v_coins then
    raise exception 'Insufficient coin balance' using errcode = '22023';
  end if;

  -- 1. Insert coin-side transaction (negative)
  insert into public.wallet_transactions (user_id, type, amount, status, description, idempotency_key, metadata)
  values (
    p_user_id, 'redemption', -v_coins, 'completed',
    'Converted ' || v_coins || ' coins to ' || v_taka || ' Taka',
    v_idem_key || ':coin',
    jsonb_build_object('taka_credited', v_taka, 'rate', v_rate)
  );

  -- 2. Insert taka-side transaction (positive)
  insert into public.taka_transactions (user_id, type, amount, status, description, idempotency_key, metadata)
  values (
    p_user_id, 'coin_conversion', v_taka, 'completed',
    'Converted ' || v_coins || ' coins to ' || v_taka || ' Taka',
    v_idem_key || ':taka',
    jsonb_build_object('coins_spent', v_coins, 'rate', v_rate)
  )
  returning id into v_conv_id;

  -- 3. Update wallet balances
  update public.wallets
     set coins         = coins - v_coins,
         taka_balance  = taka_balance + v_taka,
         total_redeemed = total_redeemed + v_coins,
         updated_at    = now()
   where user_id = p_user_id;

  return json_build_object(
    'ok', true,
    'new_coin_balance', v_wallet.coins - v_coins,
    'new_taka_balance', v_wallet.taka_balance + v_taka,
    'taka_credited', v_taka,
    'coins_spent', v_coins,
    'conversion_id', v_conv_id
  );
end;
$$;

grant execute on function public.convert_coins_to_taka(uuid, integer, integer, integer) to service_role;

-- ------------------------------------------------------------
-- 6. Atomic taka withdrawal deduction RPC (used on admin approval)
-- ------------------------------------------------------------
-- Reserves taka immediately when the user submits a request (so they can't
-- double-spend), and reconciles it on admin approve/reject.
create or replace function public.deduct_taka_for_withdrawal(
  p_user_id uuid,
  p_amount integer,
  p_idempotency_key text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_balance integer;
begin
  if p_user_id is null or p_amount is null or p_amount <= 0 then
    raise exception 'Invalid arguments';
  end if;

  select taka_balance into v_balance
    from public.wallets
   where user_id = p_user_id
   for update;

  if not found then
    raise exception 'Wallet not found';
  end if;

  if v_balance < p_amount then
    raise exception 'Insufficient Taka balance';
  end if;

  update public.wallets
     set taka_balance = taka_balance - p_amount,
         updated_at = now()
   where user_id = p_user_id;

  insert into public.taka_transactions (user_id, type, amount, status, description, idempotency_key, metadata)
  values (
    p_user_id, 'taka_withdrawal', -p_amount, 'completed',
    'Withdrawal approved',
    p_idempotency_key,
    jsonb_build_object('source', 'taka_withdrawal')
  );

  return true;
end;
$$;

grant execute on function public.deduct_taka_for_withdrawal(uuid, integer, text) to service_role;

create or replace function public.refund_taka_withdrawal(
  p_user_id uuid,
  p_amount integer,
  p_idempotency_key text,
  p_reason text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_existing integer;
begin
  if p_user_id is null or p_amount is null or p_amount <= 0 then
    raise exception 'Invalid arguments';
  end if;
  if p_idempotency_key is null or p_idempotency_key = '' then
    raise exception 'idempotency_key is required';
  end if;

  -- Idempotency: if a refund for this key already exists, no-op.
  -- The unique index `taka_transactions_idem_idx` on
  -- (user_id, idempotency_key) where idempotency_key is not null
  -- would also catch a concurrent duplicate, but checking first
  -- keeps the function return value stable.
  select 1 into v_existing
    from public.taka_transactions
   where user_id = p_user_id
     and idempotency_key = p_idempotency_key
   limit 1;
  if found then
    return false;
  end if;

  update public.wallets
     set taka_balance = taka_balance + p_amount,
         total_taka_withdrawn = greatest(total_taka_withdrawn - p_amount, 0),
         updated_at = now()
   where user_id = p_user_id;

  insert into public.taka_transactions (user_id, type, amount, status, description, idempotency_key, metadata)
  values (
    p_user_id, 'adjustment', p_amount, 'completed',
    'Withdrawal reversed: ' || coalesce(p_reason, ''),
    p_idempotency_key,
    jsonb_build_object('source', 'taka_withdrawal_refund')
  );

  return true;
end;
$$;

grant execute on function public.refund_taka_withdrawal(uuid, integer, text, text) to service_role;

-- ------------------------------------------------------------
-- 7. Atomic: mark a Taka withdrawal as completed (idempotent)
-- ------------------------------------------------------------
-- Bumps total_taka_withdrawn and flips taka_withdrawals.status
-- from 'approved' to 'completed' in one statement. The WHERE
-- clause on the UPDATE ensures the bump only happens once —
-- re-running the RPC for the same withdrawal is a no-op.
create or replace function public.complete_taka_withdrawal(
  p_withdrawal_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_withdrawal record;
begin
  select user_id, amount, status
    into v_withdrawal
    from public.taka_withdrawals
   where id = p_withdrawal_id
   for update;
  if not found then
    return false;
  end if;
  if v_withdrawal.status = 'completed' then
    -- already counted, no-op
    return false;
  end if;
  if v_withdrawal.status <> 'approved' then
    raise exception 'Withdrawal must be approved first (current: %)', v_withdrawal.status;
  end if;

  update public.taka_withdrawals
     set status = 'completed'
   where id = p_withdrawal_id;

  update public.wallets
     set total_taka_withdrawn = total_taka_withdrawn + v_withdrawal.amount,
         updated_at = now()
   where user_id = v_withdrawal.user_id;

  return true;
end;
$$;

grant execute on function public.complete_taka_withdrawal(uuid) to service_role;

-- Backwards-compatible alias kept so the existing call site keeps
-- working during the transition. It just bumps the stat without
-- flipping status, so callers MUST also update taka_withdrawals.
-- New code should prefer complete_taka_withdrawal().
create or replace function public.increment_taka_withdrawn(
  p_user_id uuid,
  p_amount integer
)
returns void
language sql
security definer
as $$
  update public.wallets
     set total_taka_withdrawn = total_taka_withdrawn + coalesce(p_amount, 0),
         updated_at = now()
   where user_id = p_user_id;
$$;

grant execute on function public.increment_taka_withdrawn(uuid, integer) to service_role;

-- ------------------------------------------------------------
-- 8. Reload PostgREST schema cache so new RPC functions are
--    visible immediately without a Supabase restart.
-- ------------------------------------------------------------
-- pg_notify inside a DO block signals PostgREST to re-read the
-- schema. This works on both self-hosted and Supabase Cloud.
-- If PGRST202 persists, also run this in the SQL editor:
--   NOTIFY pgrst, 'reload schema cache';
do $$
begin
  perform pg_notify('pgrst', 'reload schema cache');
exception when others then
  -- pg_notify may fail silently in some Supabase environments.
  -- If this raises, the manual command above will still work.
  raise notice 'pg_notify failed (%), manual reload may be needed', sqlerrm;
end
$$;
