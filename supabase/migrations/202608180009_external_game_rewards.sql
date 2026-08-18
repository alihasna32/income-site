update games
set reward_coins = 10, reward_xp = 5
where embed_url is not null
  and reward_coins = 0;