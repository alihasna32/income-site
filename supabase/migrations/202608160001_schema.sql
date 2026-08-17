-- ============================================================
-- CoinQuest — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default '',
  avatar_emoji text not null default '',
  bio text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  xp integer not null default 0,
  referral_code text unique,
  referred_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Wallets
-- ------------------------------------------------------------
create table public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  total_earned integer not null default 0,
  total_redeemed integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Wallet transactions (audit trail, never user-writable)
-- ------------------------------------------------------------
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'game_reward', 'challenge_reward', 'scratch_reward', 'daily_reward',
    'mission_reward', 'referral_reward', 'redemption', 'adjustment'
  )),
  amount integer not null check (amount <> 0),
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'reversed')),
  description text not null default '',
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index wallet_transactions_idem_idx
  on public.wallet_transactions(user_id, idempotency_key)
  where idempotency_key is not null;

create index wallet_transactions_user_created_idx
  on public.wallet_transactions(user_id, created_at desc);

-- ------------------------------------------------------------
-- Games (data-driven game catalog)
-- ------------------------------------------------------------
create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  category text not null default 'mini',
  component text not null,
  icon text not null default 'Gamepad2',
  difficulty text not null default 'easy',
  min_score integer not null default 0,
  reward_coins integer not null default 10,
  reward_xp integer not null default 5,
  max_plays_per_day integer not null default 5,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Game sessions
-- ------------------------------------------------------------
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  score integer not null default 0,
  duration_ms integer not null default 0,
  status text not null default 'completed' check (status in ('playing', 'completed', 'abandoned')),
  reward_coins integer not null default 0,
  reward_xp integer not null default 0,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index game_sessions_idem_idx
  on public.game_sessions(user_id, idempotency_key)
  where idempotency_key is not null;

create index game_sessions_user_created_idx on public.game_sessions(user_id, created_at desc);
create index game_sessions_game_created_idx on public.game_sessions(game_id, created_at desc);

-- ------------------------------------------------------------
-- Challenges (daily / rotating)
-- ------------------------------------------------------------
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  type text not null default 'daily' check (type in ('daily', 'special', 'fun')),
  difficulty text not null default 'easy',
  reward_coins integer not null default 20,
  reward_xp integer not null default 10,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Challenge attempts (includes math challenge sessions)
-- ------------------------------------------------------------
create table public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  type text not null default 'challenge' check (type in ('challenge', 'math')),
  difficulty text not null default 'easy',
  score integer not null default 0,
  total_questions integer not null default 0,
  correct_answers integer not null default 0,
  status text not null default 'started' check (status in ('started', 'completed', 'expired')),
  reward_coins integer not null default 0,
  reward_xp integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index challenge_attempts_user_created_idx
  on public.challenge_attempts(user_id, created_at desc);

-- ------------------------------------------------------------
-- Scratch card campaigns + results
-- ------------------------------------------------------------
create table public.scratch_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  daily_limit integer not null default 1,
  reward_config jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.scratch_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid not null references public.scratch_campaigns(id) on delete cascade,
  prize_label text not null,
  reward_coins integer not null default 0,
  claim_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, campaign_id, claim_date)
);

-- ------------------------------------------------------------
-- Missions + progress
-- ------------------------------------------------------------
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  type text not null check (type in (
    'play_games', 'win_games', 'complete_challenges', 'math_challenge',
    'scratch_cards', 'login_days', 'earn_coins', 'streak_days', 'referrals'
  )),
  target integer not null default 1,
  reward_coins integer not null default 25,
  reward_xp integer not null default 15,
  icon text not null default 'Target',
  is_active boolean not null default true,
  is_daily boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  progress integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  claimed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, mission_id)
);

-- ------------------------------------------------------------
-- Daily rewards (7-day cycle) + streaks + login log
-- ------------------------------------------------------------
create table public.daily_rewards (
  id serial primary key,
  day_number integer not null unique check (day_number between 1 and 7),
  reward_coins integer not null default 5,
  reward_xp integer not null default 2,
  label text not null default ''
);

create table public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_claim_date date,
  updated_at timestamptz not null default now()
);

create table public.daily_logins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  claim_date date not null default current_date,
  day_in_streak integer not null default 1,
  reward_coins integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, claim_date)
);

-- ------------------------------------------------------------
-- Achievements
-- ------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  criteria_type text not null check (criteria_type in (
    'games_played', 'games_won', 'challenges_completed', 'coins_earned',
    'streak_days', 'referrals', 'scratch_cards', 'math_challenges', 'level_reached'
  )),
  criteria_value integer not null default 1,
  reward_coins integer not null default 0,
  reward_xp integer not null default 0,
  icon text not null default 'Trophy',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  progress integer not null default 0,
  unlocked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ------------------------------------------------------------
-- Levels
-- ------------------------------------------------------------
create table public.levels (
  level integer primary key,
  title text not null,
  xp_required integer not null
);

-- ------------------------------------------------------------
-- Referrals
-- ------------------------------------------------------------
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  reward_coins integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'credited', 'rejected')),
  created_at timestamptz not null default now(),
  unique (referred_user_id)
);

create index referrals_referrer_idx on public.referrals(referrer_id, created_at desc);

-- ------------------------------------------------------------
-- Notifications
-- ------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'info' check (type in (
    'info', 'reward', 'achievement', 'mission', 'referral', 'streak', 'system'
  )),
  title text not null,
  message text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- ------------------------------------------------------------
-- Admin settings + rate limiting
-- ------------------------------------------------------------
create table public.admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Functions
-- ============================================================

-- Atomically credit coins + XP with idempotency protection.
create or replace function public.credit_reward(
  p_user_id uuid,
  p_type text,
  p_amount integer,
  p_xp integer default 0,
  p_description text default '',
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx public.wallet_transactions;
begin
  if p_amount = 0 and p_xp = 0 then
    return null;
  end if;

  if p_idempotency_key is not null then
    select * into v_tx
    from public.wallet_transactions
    where user_id = p_user_id and idempotency_key = p_idempotency_key;
    if v_tx.id is not null then
      return jsonb_build_object(
        'duplicate', true,
        'transaction_id', v_tx.id,
        'amount', v_tx.amount,
        'xp', 0
      );
    end if;
  end if;

  insert into public.wallet_transactions (
    user_id, type, amount, status, description, idempotency_key, metadata
  ) values (
    p_user_id, p_type, p_amount, 'completed', p_description, p_idempotency_key, p_metadata
  )
  returning * into v_tx;

  if p_amount > 0 then
    update public.wallets
    set coins = coins + p_amount,
        total_earned = total_earned + p_amount,
        updated_at = now()
    where user_id = p_user_id;
  elsif p_amount < 0 then
    update public.wallets
    set coins = coins + p_amount,
        total_redeemed = total_redeemed + abs(p_amount),
        updated_at = now()
    where user_id = p_user_id;
  end if;

  if p_xp > 0 then
    update public.profiles
    set xp = xp + p_xp,
        updated_at = now()
    where id = p_user_id;
  end if;

  return jsonb_build_object(
    'transaction_id', v_tx.id,
    'amount', v_tx.amount,
    'xp', p_xp,
    'duplicate', false
  );
end;
$$;

-- Atomic sliding-window rate limit check.
create or replace function public.check_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.rate_limits;
begin
  select * into v_row from public.rate_limits where key = p_key for update;

  if v_row is null then
    insert into public.rate_limits (key, count) values (p_key, 1);
    return true;
  end if;

  if now() - v_row.window_start >= make_interval(secs => p_window_seconds) then
    update public.rate_limits
    set count = 1, window_start = now(), updated_at = now()
    where key = p_key;
    return true;
  end if;

  if v_row.count >= p_max then
    return false;
  end if;

  update public.rate_limits
  set count = count + 1, updated_at = now()
  where key = p_key;
  return true;
end;
$$;

-- Create profile, wallet, streak and progress rows on signup.
-- Handles referral credit when a valid referral code is present.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_ref_code text;
  v_referrer public.profiles;
  v_referral public.referrals;
  v_referral_bonus integer;
begin
  v_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    'user_' || left(replace(new.id::text, '-', ''), 8)
  );
  v_ref_code := nullif(new.raw_user_meta_data ->> 'ref_code', '');

  insert into public.profiles (
    id, username, display_name, avatar_emoji, referral_code
  ) values (
    new.id,
    v_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), v_username),
    coalesce(nullif(new.raw_user_meta_data ->> 'avatar_emoji', ''), '😀'),
    left(md5(random()::text || new.id::text), 8)
  )
  on conflict (username) do update
  set username = 'user_' || left(replace(new.id::text, '-', ''), 8);

  insert into public.wallets (user_id) values (new.id);
  insert into public.streaks (user_id) values (new.id);

  insert into public.mission_progress (user_id, mission_id)
  select new.id, id from public.missions;

  insert into public.user_achievements (user_id, achievement_id)
  select new.id, id from public.achievements;

  if v_ref_code is not null then
    select * into v_referrer
    from public.profiles
    where referral_code = v_ref_code and id <> new.id;

    if v_referrer.id is not null then
      select value->>'bonus_coins' into v_referral_bonus
      from public.admin_settings
      where key = 'referrals';
      if v_referral_bonus is null then
        v_referral_bonus := '50';
      end if;

      insert into public.referrals (
        referrer_id, referred_user_id, reward_coins, status
      ) values (
        v_referrer.id, new.id, v_referral_bonus::int, 'credited'
      )
      on conflict (referred_user_id) do nothing
      returning * into v_referral;

      if v_referral.id is not null then
        perform public.credit_reward(
          v_referrer.id,
          'referral_reward',
          v_referral.reward_coins,
          10,
          'Referral reward — you invited a friend',
          'referral:' || v_referral.id,
          jsonb_build_object('referral_id', v_referral.id)
        );

        insert into public.notifications (user_id, type, title, message)
        values (
          v_referrer.id,
          'referral',
          'You earned a referral reward!',
          'A friend joined with your link — ' || v_referral.reward_coins || ' coins added.'
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.games enable row level security;
alter table public.game_sessions enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_attempts enable row level security;
alter table public.scratch_campaigns enable row level security;
alter table public.scratch_results enable row level security;
alter table public.missions enable row level security;
alter table public.mission_progress enable row level security;
alter table public.daily_rewards enable row level security;
alter table public.streaks enable row level security;
alter table public.daily_logins enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.levels enable row level security;
alter table public.referrals enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_settings enable row level security;
alter table public.rate_limits enable row level security;

-- Profiles: users read their own; admins read all.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- Users update only their own safe columns (never role/xp).
revoke update on public.profiles from authenticated, anon;
grant update (username, display_name, avatar_emoji, bio) on public.profiles to authenticated;

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Wallets: read-only for users.
create policy "wallets_select_own" on public.wallets
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.wallets from authenticated, anon;

-- Transactions: read-only audit trail.
create policy "transactions_select_own" on public.wallet_transactions
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.wallet_transactions from authenticated, anon;

-- Games / challenges / missions / achievements / levels: read-only catalogs.
create policy "games_read" on public.games for select using (true);
revoke insert, update, delete on public.games from authenticated, anon;

create policy "challenges_read" on public.challenges for select using (true);
revoke insert, update, delete on public.challenges from authenticated, anon;

create policy "missions_read" on public.missions for select using (true);
revoke insert, update, delete on public.missions from authenticated, anon;

create policy "daily_rewards_read" on public.daily_rewards for select using (true);
revoke insert, update, delete on public.daily_rewards from authenticated, anon;

create policy "achievements_read" on public.achievements for select using (true);
revoke insert, update, delete on public.achievements from authenticated, anon;

create policy "levels_read" on public.levels for select using (true);
revoke insert, update, delete on public.levels from authenticated, anon;

create policy "scratch_campaigns_read" on public.scratch_campaigns
  for select using (is_active = true);
revoke insert, update, delete on public.scratch_campaigns from authenticated, anon;

-- Game sessions: users insert/read their own.
create policy "game_sessions_select_own" on public.game_sessions
  for select using (auth.uid() = user_id);
create policy "game_sessions_insert_own" on public.game_sessions
  for insert with check (auth.uid() = user_id);
revoke update, delete on public.game_sessions from authenticated, anon;

-- Challenge attempts: users read their own only.
create policy "attempts_select_own" on public.challenge_attempts
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.challenge_attempts from authenticated, anon;

-- Scratch results: users read their own only.
create policy "scratch_select_own" on public.scratch_results
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.scratch_results from authenticated, anon;

-- Mission progress: users read their own only.
create policy "progress_select_own" on public.mission_progress
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.mission_progress from authenticated, anon;

-- Streaks: users read their own only.
create policy "streaks_select_own" on public.streaks
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.streaks from authenticated, anon;

-- Daily logins: users read their own only.
create policy "logins_select_own" on public.daily_logins
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.daily_logins from authenticated, anon;

-- Achievements: users read their own only.
create policy "user_ach_select_own" on public.user_achievements
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.user_achievements from authenticated, anon;

-- Referrals: users read rows where they are involved.
create policy "referrals_select_own" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_user_id);
revoke insert, update, delete on public.referrals from authenticated, anon;

-- Notifications: users read/update their own (read flag only).
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);
revoke insert, delete on public.notifications from authenticated, anon;
revoke update on public.notifications from authenticated, anon;
grant update (read) on public.notifications to authenticated;

-- Admin settings and rate limits: never client-accessible.
revoke all on public.admin_settings from authenticated, anon;
revoke all on public.rate_limits from authenticated, anon;

-- Function access: service role only (server-side reward logic).
revoke all on function public.credit_reward(uuid, text, integer, integer, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.credit_reward(uuid, text, integer, integer, text, text, jsonb) to service_role;
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Let authenticated users read their own profile (required for the app).
grant select on public.profiles to authenticated;
grant select on public.wallets, public.wallet_transactions to authenticated;
grant select on public.game_sessions, public.challenge_attempts, public.scratch_results to authenticated;
grant select on public.missions, public.mission_progress, public.daily_rewards, public.streaks, public.daily_logins to authenticated;
grant select on public.achievements, public.user_achievements, public.levels to authenticated;
grant select on public.referrals, public.notifications to authenticated;
grant select on public.games, public.challenges, public.scratch_campaigns to authenticated, anon;