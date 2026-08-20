-- Guest free-spin reward type (credited after a guest registers).
alter table public.wallet_transactions drop constraint if exists wallet_transactions_type_check;
alter table public.wallet_transactions add constraint wallet_transactions_type_check check (type in (
  'game_reward', 'challenge_reward', 'scratch_reward', 'daily_reward',
  'mission_reward', 'referral_reward', 'referral_bonus', 'math_challenge_reward',
  'withdrawal', 'guest_reward', 'redemption', 'adjustment'
));