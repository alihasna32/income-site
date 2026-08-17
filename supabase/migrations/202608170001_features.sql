-- ============================================================
-- CoinQuest — feature migration: daily math challenge, withdrawals,
-- referral invited-user bonus, new transaction types.
-- Runs AFTER 202608160001_schema.sql.
-- ============================================================

-- 1. New transaction types --------------------------------------
alter table public.wallet_transactions
  drop constraint wallet_transactions_type_check;
alter table public.wallet_transactions
  add constraint wallet_transactions_type_check check (type in (
    'game_reward', 'challenge_reward', 'scratch_reward', 'daily_reward',
    'mission_reward', 'referral_reward', 'referral_bonus',
    'math_challenge_reward', 'withdrawal', 'redemption', 'adjustment'
  ));

-- 2. Withdrawals ------------------------------------------------
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  method text not null check (method in ('bank_transfer', 'mobile_wallet', 'paypal')),
  details jsonb not null default '{}'::jsonb,
  admin_note text not null default '',
  processed_by uuid references public.profiles(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index withdrawals_user_created_idx on public.withdrawals(user_id, created_at desc);
create index withdrawals_status_idx on public.withdrawals(status, created_at desc);

create unique index withdrawals_one_pending_idx
  on public.withdrawals(user_id)
  where status = 'pending';

-- 3. Daily math challenge ---------------------------------------
create table public.math_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_date date not null default current_date,
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
  question text not null,
  answer text not null,
  submitted_answer text,
  is_correct boolean,
  reward_coins integer not null default 0,
  reward_credited boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_date)
);

create index math_attempts_user_date_idx on public.math_attempts(user_id, challenge_date desc);

-- 4. RLS ----------------------------------------------------------
alter table public.withdrawals enable row level security;
alter table public.math_attempts enable row level security;

create policy "withdrawals_select_own" on public.withdrawals
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.withdrawals from authenticated, anon;
grant select on public.withdrawals to authenticated;

-- Math attempts: fully server-side (questions/answers must never leak).
revoke all on public.math_attempts from authenticated, anon;

-- 5. Trigger: referral invited-user bonus ------------------------
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
  v_invite_bonus integer;
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
      select value->>'bonus_coins', value->>'invite_bonus_coins'
      into v_referral_bonus, v_invite_bonus
      from public.admin_settings
      where key = 'referrals';
      if v_referral_bonus is null then
        v_referral_bonus := '30';
      end if;
      if v_invite_bonus is null then
        v_invite_bonus := '30';
      end if;

      perform public.credit_reward(
        new.id,
        'referral_bonus',
        v_invite_bonus::int,
        5,
        'Referral bonus — you joined through a friend''s invite',
        'referral-bonus:' || new.id,
        '{}'::jsonb
      );

      insert into public.notifications (user_id, type, title, message)
      values (
        new.id,
        'referral',
        'Referral bonus received!',
        'You joined through a friend''s invite — ' || v_invite_bonus || ' coins added.'
      );

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

-- 6. Admin settings (configurable values) ------------------------
insert into public.admin_settings (key, value) values
('referrals', '{"bonus_coins": 30, "invite_bonus_coins": 30}'),
('withdrawals', '{"min_amount": 1000}'),
('math_daily', '{"reward_coins": 20, "difficulty_weights": {"easy": 60, "medium": 30, "hard": 10}}')
on conflict (key) do update set value = excluded.value, updated_at = now();