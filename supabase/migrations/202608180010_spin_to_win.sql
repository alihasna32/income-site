insert into public.games (slug, title, description, category, component, icon, difficulty, min_score, reward_coins, reward_xp, max_plays_per_day, config, is_active, sort_order)
values (
  'spin-to-win',
  'Spin to Win',
  'Spin the wheel — 3 chances every day to win 10-100 coins. Pure luck, zero skill!',
  'funny',
  'LuckyWheel',
  'Disc',
  'fun',
  1,
  10,
  5,
  3,
  '{"luck": true, "dailyRewardOnce": false, "segments": 8, "outcomes": [{"label": "+10", "coins": 10, "weight": 1}, {"label": "+20", "coins": 20, "weight": 1}, {"label": "0", "coins": 0, "weight": 1}, {"label": "+30", "coins": 30, "weight": 1}, {"label": "+50", "coins": 50, "weight": 1}, {"label": "0", "coins": 0, "weight": 1}, {"label": "+75", "coins": 75, "weight": 1}, {"label": "+100", "coins": 100, "weight": 1}]}'::jsonb,
  true,
  23
)
on conflict (slug) do nothing;