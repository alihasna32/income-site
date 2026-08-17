-- ============================================================
-- CoinQuest — seed data
-- Run AFTER schema.sql.
-- ============================================================

-- Games -------------------------------------------------------
insert into public.games (slug, title, description, category, component, icon, difficulty, min_score, reward_coins, reward_xp, max_plays_per_day, config, is_active, sort_order) values
('memory-match', 'Memory Match', 'Flip cards and match pairs before the timer runs out.', 'mini', 'MemoryMatch', 'Layers', 'easy', 4, 10, 5, 5, '{"pairs": 6, "time_limit_seconds": 60, "thresholds": [{"minScore": 6, "coins": 20, "xp": 10}, {"minScore": 4, "coins": 12, "xp": 6}, {"minScore": 2, "coins": 6, "xp": 3}]}', true, 10),
('tap-challenge', 'Tap Challenge', 'Tap the targets as fast as you can before time runs out.', 'mini', 'TapChallenge', 'Pointer', 'easy', 10, 10, 5, 5, '{"duration_seconds": 15, "thresholds": [{"minScore": 30, "coins": 20, "xp": 10}, {"minScore": 20, "coins": 12, "xp": 6}, {"minScore": 10, "coins": 6, "xp": 3}]}', true, 20),
('reaction-test', 'Reaction Test', 'Tap as soon as the screen turns green. How fast are you?', 'mini', 'ReactionTest', 'Zap', 'easy', 5, 8, 4, 5, '{"rounds": 5, "thresholds": [{"minScore": 3, "coins": 16, "xp": 8}, {"minScore": 2, "coins": 10, "xp": 5}, {"minScore": 1, "coins": 4, "xp": 2}]}', true, 30),
('number-guess', 'Number Guess', 'Guess the secret number with clever hints.', 'brain', 'NumberGuess', 'Hash', 'easy', 1, 8, 4, 5, '{"min": 1, "max": 100, "max_guesses": 7, "thresholds": [{"minScore": 7, "coins": 20, "xp": 10}, {"minScore": 4, "coins": 12, "xp": 6}, {"minScore": 1, "coins": 6, "xp": 3}]}', true, 40),
('rock-paper-scissors', 'Rock Paper Scissors', 'Beat the bot in a best-of-three showdown.', 'funny', 'RockPaperScissors', 'Hand', 'easy', 1, 8, 4, 5, '{"rounds": 3, "thresholds": [{"minScore": 3, "coins": 18, "xp": 9}, {"minScore": 2, "coins": 10, "xp": 5}, {"minScore": 1, "coins": 4, "xp": 2}]}', true, 50),
('color-match', 'Color Match', 'Pick the word that matches the color of the text. Tricky!', 'brain', 'ColorMatch', 'Palette', 'medium', 5, 12, 6, 5, '{"rounds": 10, "time_limit_seconds": 30, "thresholds": [{"minScore": 8, "coins": 24, "xp": 12}, {"minScore": 5, "coins": 14, "xp": 7}, {"minScore": 2, "coins": 6, "xp": 3}]}', true, 60),
('quick-quiz', 'Quick Quiz', 'Answer fun trivia questions against the clock.', 'brain', 'QuickQuiz', 'Brain', 'medium', 4, 12, 6, 5, '{"questions": 8, "time_limit_seconds": 45, "thresholds": [{"minScore": 6, "coins": 24, "xp": 12}, {"minScore": 4, "coins": 14, "xp": 7}, {"minScore": 2, "coins": 6, "xp": 3}]}', true, 70),
('emoji-guess', 'Emoji Guess', 'Decode the emoji clues and guess the answer.', 'funny', 'EmojiGuess', 'Smile', 'easy', 3, 8, 4, 5, '{"questions": 6, "thresholds": [{"minScore": 5, "coins": 16, "xp": 8}, {"minScore": 3, "coins": 10, "xp": 5}, {"minScore": 1, "coins": 4, "xp": 2}]}', true, 80),
('lucky-wheel', 'Lucky Wheel', 'Spin the wheel and test your luck. No purchase needed!', 'funny', 'LuckyWheel', 'Disc', 'easy', 1, 6, 3, 3, '{"spins": 1, "segments": 8, "luck": true, "outcomes": [{"label": "+4 coins", "coins": 4, "weight": 30}, {"label": "+8 coins", "coins": 8, "weight": 25}, {"label": "+12 coins", "coins": 12, "weight": 20}, {"label": "+18 coins", "coins": 18, "weight": 12}, {"label": "+25 coins", "coins": 25, "weight": 8}, {"label": "+40 coins", "coins": 40, "weight": 4}, {"label": "+60 coins", "coins": 60, "weight": 1}]}', true, 90),
('mystery-box', 'Mystery Box', 'Open a mystery box for a surprise reward. Daily surprise!', 'funny', 'MysteryBox', 'Gift', 'easy', 1, 8, 4, 1, '{"boxes": 3, "luck": true, "outcomes": [{"label": "+6 coins", "coins": 6, "weight": 30}, {"label": "+12 coins", "coins": 12, "weight": 25}, {"label": "+18 coins", "coins": 18, "weight": 18}, {"label": "+30 coins", "coins": 30, "weight": 12}, {"label": "+50 coins", "coins": 50, "weight": 8}, {"label": "+100 coins", "coins": 100, "weight": 5}, {"label": "+250 coins", "coins": 250, "weight": 2}]}', true, 100);

-- Daily rewards (7-day cycle) --------------------------------
insert into public.daily_rewards (day_number, reward_coins, reward_xp, label) values
(1, 10, 5, 'Day 1'),
(2, 15, 8, 'Day 2'),
(3, 20, 10, 'Day 3'),
(4, 25, 12, 'Day 4'),
(5, 35, 15, 'Day 5'),
(6, 50, 20, 'Day 6'),
(7, 100, 40, 'Day 7 — Bonus!');

-- Levels ------------------------------------------------------
insert into public.levels (level, title, xp_required) values
(1, 'Beginner', 0),
(2, 'Explorer', 100),
(3, 'Challenger', 250),
(4, 'Pro', 500),
(5, 'Champion', 900),
(6, 'Master', 1500),
(7, 'Grandmaster', 2300),
(8, 'Legend', 3300),
(9, 'Mythic', 4600),
(10, 'Living Legend', 6000);

-- Missions ----------------------------------------------------
insert into public.missions (slug, title, description, type, target, reward_coins, reward_xp, icon, is_active, is_daily, sort_order) values
('play-3-games', 'Game On!', 'Play 3 games', 'play_games', 3, 25, 15, 'Gamepad2', true, true, 10),
('win-2-games', 'Winning Streak', 'Score above the threshold in 2 games', 'win_games', 2, 35, 20, 'Trophy', true, true, 20),
('complete-challenge', 'Challenge Accepted', 'Complete 1 challenge', 'complete_challenges', 1, 30, 15, 'Flag', true, true, 30),
('math-master', 'Math Master', 'Complete a math challenge', 'math_challenge', 1, 30, 15, 'Calculator', true, true, 40),
('scratch-day', 'Scratch That', 'Scratch a card today', 'scratch_cards', 1, 20, 10, 'Ticket', true, true, 50),
('login-week', '7-Day Streak', 'Maintain a 7-day login streak', 'streak_days', 7, 100, 50, 'Flame', true, false, 60),
('invite-friends', 'Invite Friends', 'Refer 1 friend to CoinQuest', 'referrals', 1, 75, 30, 'Users', true, false, 70),
('earn-500', 'Coin Collector', 'Earn 500 coins in total', 'earn_coins', 500, 60, 25, 'Coins', true, false, 80);

-- Achievements ------------------------------------------------
insert into public.achievements (slug, title, description, criteria_type, criteria_value, reward_coins, reward_xp, icon, sort_order) values
('first-game', 'First Steps', 'Play your first game', 'games_played', 1, 15, 10, 'Rocket', 10),
('first-win', 'First Win', 'Win your first game', 'games_won', 1, 20, 10, 'Trophy', 20),
('coins-100', 'Century Club', 'Earn 100 coins in total', 'coins_earned', 100, 25, 15, 'Coins', 30),
('coins-1000', 'Coin Collector', 'Earn 1,000 coins in total', 'coins_earned', 1000, 100, 50, 'CircleDollarSign', 40),
('streak-7', 'Weekly Warrior', 'Keep a 7-day login streak', 'streak_days', 7, 75, 40, 'Flame', 50),
('streak-30', 'Monthly Legend', 'Keep a 30-day login streak', 'streak_days', 30, 250, 120, 'Crown', 60),
('games-50', 'Game Enthusiast', 'Play 50 games', 'games_played', 50, 120, 60, 'Gamepad2', 70),
('challenges-100', 'Challenge Master', 'Complete 100 challenges', 'challenges_completed', 100, 200, 100, 'Flag', 80),
('referral-master', 'Social Butterfly', 'Refer 5 friends', 'referrals', 5, 150, 75, 'Users', 90),
('scratch-10', 'Scratch Champion', 'Scratch 10 cards', 'scratch_cards', 10, 80, 40, 'Ticket', 100),
('math-10', 'Numbers Wizard', 'Complete 10 math challenges', 'math_challenges', 10, 90, 45, 'Calculator', 110),
('level-5', 'Rising Star', 'Reach level 5', 'level_reached', 5, 100, 50, 'Star', 120);

-- Scratch campaign --------------------------------------------
insert into public.scratch_campaigns (name, daily_limit, reward_config, is_active) values
('Daily Scratch', 1, '[
  {"label": "5 coins", "coins": 5, "weight": 30},
  {"label": "10 coins", "coins": 10, "weight": 25},
  {"label": "15 coins", "coins": 15, "weight": 18},
  {"label": "25 coins", "coins": 25, "weight": 12},
  {"label": "50 coins", "coins": 50, "weight": 8},
  {"label": "100 coins", "coins": 100, "weight": 4},
  {"label": "250 coins", "coins": 250, "weight": 2},
  {"label": "500 coins", "coins": 500, "weight": 1}
]', true);

-- Rotating daily challenges -----------------------------------
insert into public.challenges (title, description, type, difficulty, reward_coins, reward_xp, is_active, config) values
('Word Count Sprint', 'How many letters are in the word below? One shot per day.', 'fun', 'easy', 20, 10, true, '{"kind": "text", "question": "Count the letters: SUPER CALIFRAGILISTIC", "answer": "24"}'),
('The Riddle of the Day', 'Solve today''s riddle. Think carefully!', 'fun', 'medium', 25, 12, true, '{"kind": "options", "question": "What has keys but can''t open locks?", "options": ["A piano", "A map", "A keyboard", "A lock"], "answer": "A keyboard"}'),
('Quick Math Logic', 'If 5 machines make 5 widgets in 5 minutes, how long does it take 100 machines to make 100 widgets?', 'fun', 'hard', 35, 15, true, '{"kind": "options", "question": "5 machines make 5 widgets in 5 minutes. How many minutes does it take 100 machines to make 100 widgets?", "options": ["5", "20", "100", "500"], "answer": "5"}'),
('Emoji Translation', 'Translate this emoji phrase: 🐝 + 🍯 = ?', 'fun', 'easy', 20, 10, true, '{"kind": "options", "question": "What does this emoji phrase mean? 🐝 + 🍯", "options": ["Bee and honey", "Busy as a bee", "Sweet as honey", "A bee farm"], "answer": "Busy as a bee"}'),
('Spot the Odd One', 'Which number does not belong?', 'fun', 'medium', 25, 12, true, '{"kind": "options", "question": "Which number does not belong? 2, 3, 5, 7, 9, 11", "options": ["3", "5", "9", "11"], "answer": "9"}'),
('The Trailing Zeros', 'How many zeros does the number 10! (factorial) end with?', 'fun', 'hard', 35, 15, true, '{"kind": "options", "question": "How many trailing zeros does 10! have?", "options": ["1", "2", "3", "4"], "answer": "2"}'),
('Speed Anagram', 'Rearrange these letters to make a word: E R T A W', 'fun', 'easy', 20, 10, true, '{"kind": "text", "question": "Rearrange E R T A W into a common English word", "answer": "water"}'),
('The Age Puzzle', 'A father is 4 times as old as his son. In 20 years, he will be twice as old. How old is the son now?', 'fun', 'hard', 35, 15, true, '{"kind": "options", "question": "A father is 4 times as old as his son. In 20 years he will be twice as old. How old is the son now?", "options": ["8", "10", "12", "15"], "answer": "10"}');

-- Admin settings ----------------------------------------------
insert into public.admin_settings (key, value) values
('referrals', '{"bonus_coins": 30, "invite_bonus_coins": 30}'),
('withdrawals', '{"min_amount": 1000}'),
('math_daily', '{"reward_coins": 20, "difficulty_weights": {"easy": 60, "medium": 30, "hard": 10}}'),
('streaks', '{"grace_days": 0}'),
('math', '{"daily_attempts": 5, "question_counts": {"easy": 8, "medium": 10, "hard": 12, "expert": 15}, "time_limits": {"easy": 90, "medium": 120, "hard": 180, "expert": 240}, "per_question": {"easy": {"coins": 3, "xp": 1}, "medium": {"coins": 4, "xp": 2}, "hard": {"coins": 6, "xp": 3}, "expert": {"coins": 8, "xp": 4}}}'),
('platform', '{"site_name": "CoinQuest", "tagline": "Play. Challenge Yourself. Earn Rewards."}');

-- To promote a user to admin, run:
--   update public.profiles set role = 'admin' where id = '<user-uuid>';