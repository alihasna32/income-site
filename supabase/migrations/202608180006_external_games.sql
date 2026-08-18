alter table public.games add column if not exists embed_url text;

insert into public.games (slug, title, description, category, component, icon, difficulty, min_score, reward_coins, reward_xp, max_plays_per_day, config, is_active, sort_order, embed_url)
values
  ('basketball-stars', 'Basketball Stars', '1v1 basketball showdown — shoot, block and slam your way to victory.', 'arcade', 'External', 'Trophy', 'fun', 1, 0, 0, 999, '{}', true, 11, 'https://html5.gamedistribution.com/69d78d071f704fa183d75b4114ae40ec/'),
  ('hook', 'Hook', 'Swing through 120+ tricky levels with perfect timing.', 'arcade', 'External', 'Gamepad2', 'fun', 1, 0, 0, 999, '{}', true, 12, 'https://html5.gamedistribution.com/d76e05b14d3e4f3ea48be493b482defd/'),
  ('gold-miner', 'Gold Miner', 'Dig deep, grab gold nuggets and beat the daily target.', 'arcade', 'External', 'Star', 'fun', 1, 0, 0, 999, '{}', true, 13, 'https://html5.gamedistribution.com/c50d8a3e26c54b66b67f5059eae2d13d/'),
  ('bottle-flip-3d', 'Bottle Flip 3D', 'Flip the bottle and land it perfectly — addictive and simple.', 'arcade', 'External', 'Zap', 'fun', 1, 0, 0, 999, '{}', true, 14, 'https://html5.gamedistribution.com/ae2e75396f754b98a8751fdef161bb7d/'),
  ('snake-vs-blocks', 'Snake VS Blocks', 'Grow your snake, smash blocks and survive the onslaught.', 'arcade', 'External', 'Target', 'fun', 1, 0, 0, 999, '{}', true, 15, 'https://html5.gamedistribution.com/e6d7cf252a5f4ac1a5ad8d59cf05b70c/')
on conflict (slug) do nothing;