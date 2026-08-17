-- 202608170004_auto_username.sql
-- Usernames are auto-generated from the display name plus a random unique
-- number, e.g. "Ali Hasan" -> alihasan1234. The signup trigger derives the
-- username (metadata username is ignored), and existing default usernames
-- (user_*) and plain slugs are backfilled.

-- Generator: slug(display name, max 20 chars) + 4 random digits, unique against profiles.
create or replace function public.generate_username(p_display text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_candidate text;
  v_try int := 0;
begin
  v_slug := lower(regexp_replace(coalesce(p_display, ''), '[^a-zA-Z0-9]', '', 'g'));
  if v_slug = '' then
    v_slug := 'player';
  end if;
  v_slug := left(v_slug, 20);

  loop
    v_try := v_try + 1;
    v_candidate := v_slug || floor(random() * 9000 + 1000)::int::text;
    exit when v_try >= 30 or not exists (
      select 1 from public.profiles where username = v_candidate
    );
  end loop;

  if exists (select 1 from public.profiles where username = v_candidate) then
    v_candidate := v_slug || left(replace(md5(random()::text), '-', ''), 6);
  end if;

  return v_candidate;
end;
$$;

-- Signup trigger: always derive username from the display name.
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
  v_username := public.generate_username(new.raw_user_meta_data ->> 'display_name');
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
  set username = v_username || left(replace(new.id::text, '-', ''), 4);

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

-- Backfill: regenerate usernames that are null, default (user_*), or not in
-- the "slug + 4 digits" shape.
do $$
declare
  r record;
  v_username text;
begin
  for r in
    select id, display_name
    from public.profiles
    where username is null
       or username like 'user\_%'
       or username !~ '^[a-z0-9]{1,20}[0-9]{4}$'
  loop
    v_username := public.generate_username(r.display_name);
    update public.profiles set username = v_username where id = r.id;
  end loop;
end $$;