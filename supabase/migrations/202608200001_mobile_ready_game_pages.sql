-- The previous raw game-file URLs can render a black canvas on mobile browsers.
-- Open the providers' own mobile-ready game pages in a new tab instead.

update public.games
set
  title = 'Tap Tap Shots',
  description = 'Tap the ball into the hoop and keep your scoring streak alive.',
  category = 'arcade',
  icon = 'Trophy',
  difficulty = 'easy',
  embed_url = 'https://www.crazygames.com/game/tap-tap-shots'
where slug = 'basketball-stars';

update public.games
set
  title = 'Bubble Blast',
  description = 'Aim, shoot and pop colorful bubbles in a quick casual challenge.',
  category = 'arcade',
  icon = 'Zap',
  difficulty = 'easy',
  embed_url = 'https://www.crazygames.com/game/bubble-blast-pwd'
where slug = 'hook';

update public.games
set
  title = 'Water Jam',
  description = 'Sort the colorful water into matching tubes with smart moves.',
  category = 'puzzle',
  icon = 'Layers',
  difficulty = 'easy',
  embed_url = 'https://www.crazygames.com/game/water-jam'
where slug = 'gold-miner';

update public.games
set
  title = 'Basket Battle',
  description = 'Aim, tap and outscore your opponent in fast basketball rounds.',
  category = 'arcade',
  icon = 'Trophy',
  difficulty = 'easy',
  embed_url = 'https://www.crazygames.com/game/basket-battle-zmg'
where slug = 'bottle-flip-3d';

update public.games
set
  title = 'Jet Rush',
  description = 'Pilot through fast arcade courses and dodge every obstacle.',
  category = 'action',
  icon = 'Rocket',
  difficulty = 'medium',
  embed_url = 'https://www.crazygames.com/game/jet-rush'
where slug = 'snake-vs-blocks';

update public.games
set
  title = 'Air Hockey Cup',
  description = 'Touch, aim and shoot your way through a fast air-hockey cup.',
  category = 'puzzle',
  icon = 'Target',
  difficulty = 'easy',
  embed_url = 'https://www.crazygames.com/game/air-hockey-cup'
where slug = 'sudoku-classic';

update public.games
set
  title = 'A Small World Cup',
  description = 'Aim, launch and score in a playful mini football tournament.',
  category = 'action',
  icon = 'Flag',
  difficulty = 'easy',
  embed_url = 'https://www.crazygames.com/game/a-small-world-cup-snk'
where slug = 'water-sort-puzzle';

update public.games
set
  title = 'Drift Boss',
  description = 'Tap and hold to drift around tricky corners without falling.',
  category = 'action',
  icon = 'Rocket',
  difficulty = 'easy',
  embed_url = 'https://www.crazygames.com/game/drift-boss'
where slug = 'drift-boss';

update public.games
set
  title = 'Soccer Masters',
  description = 'Choose a team and play a lively football match against the computer.',
  category = 'driving',
  icon = 'Flag',
  difficulty = 'medium',
  embed_url = 'https://www.crazygames.com/game/soccer-masters-euro-2020'
where slug = 'moto-rush';

update public.games
set
  title = 'Soccards',
  description = 'Build a football strategy and play your best cards to win.',
  category = 'puzzle',
  icon = 'Layers',
  difficulty = 'easy',
  embed_url = 'https://www.crazygames.com/game/soccards'
where slug = 'speed-racer';

update public.games
set
  title = 'Basketball Orbit',
  description = 'Time your shot and send basketballs soaring toward the hoop.',
  category = 'action',
  icon = 'Trophy',
  difficulty = 'easy',
  embed_url = 'https://www.crazygames.com/game/basketball-orbit'
where slug = 'rooftop-snipers';

update public.games
set
  title = 'Real Football',
  description = 'Manage your team and play a classic football season on the go.',
  category = 'action',
  icon = 'Flag',
  difficulty = 'medium',
  embed_url = 'https://www.crazygames.com/game/real-football-bac'
where slug = 'torture-the-trollface';
