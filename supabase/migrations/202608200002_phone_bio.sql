-- Phone numbers for login + profile display.
alter table public.profiles add column if not exists phone text;

create unique index if not exists profiles_phone_idx
  on public.profiles(phone) where phone is not null;

-- Copy phone from auth metadata at signup (normalized digits only).
-- If the phone is already taken, drop it silently so signup never fails.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_ref_code text;
  v_phone text;
  v_referrer public.profiles;
  v_referral public.referrals;
  v_referral_bonus integer;
begin
  v_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    'user_' || left(replace(new.id::text, '-', ''), 8)
  );
  v_ref_code := nullif(new.raw_user_meta_data ->> 'ref_code', '');
  v_phone := nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', ''), '[^0-9]', '', 'g'), '');
  if v_phone is not null and exists (select 1 from public.profiles where phone = v_phone) then
    v_phone := null;
  end if;

  insert into public.profiles (
    id, username, display_name, avatar_emoji, referral_code, phone
  ) values (
    new.id,
    v_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), v_username),
    coalesce(nullif(new.raw_user_meta_data ->> 'avatar_emoji', ''), '😀'),
    left(md5(random()::text || new.id::text), 8),
    v_phone
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

-- Allow users to update their own phone via the app.
grant update (username, display_name, avatar_emoji, bio, phone) on public.profiles to authenticated;