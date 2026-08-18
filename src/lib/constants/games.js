export const GAME_CATEGORIES = {
  mini: "Mini Games",
  funny: "Fun & Silly",
  brain: "Brain Games",
  arcade: "Popular Online Games",
  puzzle: "Puzzle Games",
  driving: "Driving & Racing",
  action: "Action Games",
};

export const GAMES = [
  {
    slug: "memory-match",
    title: "Memory Match",
    description: "Flip cards and match pairs before the timer runs out.",
    category: "mini",
    component: "MemoryMatch",
    icon: "Layers",
    difficulty: "easy",
    min_score: 4,
    reward_coins: 10,
    reward_xp: 5,
    max_plays_per_day: 5,
    config: {
      pairs: 6,
      time_limit_seconds: 60,
      thresholds: [
        { minScore: 6, coins: 20, xp: 10 },
        { minScore: 4, coins: 12, xp: 6 },
        { minScore: 2, coins: 6, xp: 3 },
      ],
    },
  },
  {
    slug: "tap-challenge",
    title: "Tap Challenge",
    description: "Tap the targets as fast as you can before time runs out.",
    category: "mini",
    component: "TapChallenge",
    icon: "Pointer",
    difficulty: "easy",
    min_score: 10,
    reward_coins: 10,
    reward_xp: 5,
    max_plays_per_day: 5,
    config: {
      duration_seconds: 15,
      thresholds: [
        { minScore: 30, coins: 20, xp: 10 },
        { minScore: 20, coins: 12, xp: 6 },
        { minScore: 10, coins: 6, xp: 3 },
      ],
    },
  },
  {
    slug: "reaction-test",
    title: "Reaction Test",
    description: "Tap as soon as the screen turns green. How fast are you?",
    category: "mini",
    component: "ReactionTest",
    icon: "Zap",
    difficulty: "easy",
    min_score: 5,
    reward_coins: 8,
    reward_xp: 4,
    max_plays_per_day: 5,
    config: {
      rounds: 5,
      thresholds: [
        { minScore: 3, coins: 16, xp: 8 },
        { minScore: 2, coins: 10, xp: 5 },
        { minScore: 1, coins: 4, xp: 2 },
      ],
    },
  },
  {
    slug: "number-guess",
    title: "Number Guess",
    description: "Guess the secret number with clever hints.",
    category: "brain",
    component: "NumberGuess",
    icon: "Hash",
    difficulty: "easy",
    min_score: 1,
    reward_coins: 8,
    reward_xp: 4,
    max_plays_per_day: 5,
    config: {
      min: 1,
      max: 100,
      max_guesses: 7,
      thresholds: [
        { minScore: 7, coins: 20, xp: 10 },
        { minScore: 4, coins: 12, xp: 6 },
        { minScore: 1, coins: 6, xp: 3 },
      ],
    },
  },
  {
    slug: "rock-paper-scissors",
    title: "Rock Paper Scissors",
    description: "Beat the bot in a best-of-three showdown.",
    category: "funny",
    component: "RockPaperScissors",
    icon: "Hand",
    difficulty: "easy",
    min_score: 1,
    reward_coins: 8,
    reward_xp: 4,
    max_plays_per_day: 5,
    config: {
      rounds: 3,
      thresholds: [
        { minScore: 3, coins: 18, xp: 9 },
        { minScore: 2, coins: 10, xp: 5 },
        { minScore: 1, coins: 4, xp: 2 },
      ],
    },
  },
  {
    slug: "color-match",
    title: "Color Match",
    description: "Pick the word that matches the color of the text. Tricky!",
    category: "brain",
    component: "ColorMatch",
    icon: "Palette",
    difficulty: "medium",
    min_score: 5,
    reward_coins: 12,
    reward_xp: 6,
    max_plays_per_day: 5,
    config: {
      rounds: 10,
      time_limit_seconds: 30,
      thresholds: [
        { minScore: 8, coins: 24, xp: 12 },
        { minScore: 5, coins: 14, xp: 7 },
        { minScore: 2, coins: 6, xp: 3 },
      ],
    },
  },
  {
    slug: "quick-quiz",
    title: "Quick Quiz",
    description: "Answer fun trivia questions against the clock.",
    category: "brain",
    component: "QuickQuiz",
    icon: "Brain",
    difficulty: "medium",
    min_score: 4,
    reward_coins: 12,
    reward_xp: 6,
    max_plays_per_day: 5,
    config: {
      questions: 8,
      time_limit_seconds: 45,
      thresholds: [
        { minScore: 6, coins: 24, xp: 12 },
        { minScore: 4, coins: 14, xp: 7 },
        { minScore: 2, coins: 6, xp: 3 },
      ],
    },
  },
  {
    slug: "emoji-guess",
    title: "Emoji Guess",
    description: "Decode the emoji clues and guess the answer.",
    category: "funny",
    component: "EmojiGuess",
    icon: "Smile",
    difficulty: "easy",
    min_score: 3,
    reward_coins: 8,
    reward_xp: 4,
    max_plays_per_day: 5,
    config: {
      questions: 6,
      thresholds: [
        { minScore: 5, coins: 16, xp: 8 },
        { minScore: 3, coins: 10, xp: 5 },
        { minScore: 1, coins: 4, xp: 2 },
      ],
    },
  },
  {
    slug: "lucky-wheel",
    title: "Lucky Wheel",
    description: "Spin the wheel and test your luck. No purchase needed!",
    category: "funny",
    component: "LuckyWheel",
    icon: "Disc",
    difficulty: "easy",
    min_score: 1,
    reward_coins: 6,
    reward_xp: 3,
    max_plays_per_day: 3,
    config: {
      spins: 1,
      segments: 8,
      luck: true,
      outcomes: [
        { label: "+4 coins", coins: 4, weight: 30 },
        { label: "+8 coins", coins: 8, weight: 25 },
        { label: "+12 coins", coins: 12, weight: 20 },
        { label: "+18 coins", coins: 18, weight: 12 },
        { label: "+25 coins", coins: 25, weight: 8 },
        { label: "+40 coins", coins: 40, weight: 4 },
        { label: "+60 coins", coins: 60, weight: 1 },
      ],
    },
  },
  {
    slug: "mystery-box",
    title: "Mystery Box",
    description: "Open a mystery box for a surprise reward. Daily surprise!",
    category: "funny",
    component: "MysteryBox",
    icon: "Gift",
    difficulty: "easy",
    min_score: 1,
    reward_coins: 8,
    reward_xp: 4,
    max_plays_per_day: 1,
    config: {
      boxes: 3,
      luck: true,
      outcomes: [
        { label: "+6 coins", coins: 6, weight: 30 },
        { label: "+12 coins", coins: 12, weight: 25 },
        { label: "+18 coins", coins: 18, weight: 18 },
        { label: "+30 coins", coins: 30, weight: 12 },
        { label: "+50 coins", coins: 50, weight: 8 },
        { label: "+100 coins", coins: 100, weight: 5 },
        { label: "+250 coins", coins: 250, weight: 2 },
      ],
    },
  },
];

export function getGameBySlug(slug) {
  return GAMES.find((game) => game.slug === slug) || null;
}

export function rewardForScore(game, score) {
  const thresholds = (game.config && game.config.thresholds) || [];
  const tier = thresholds.find((t) => score >= t.minScore);
  if (tier) {
    return { coins: tier.coins, xp: tier.xp, tier: "tier" };
  }
  if (score >= game.min_score) {
    return { coins: game.reward_coins, xp: game.reward_xp, tier: "base" };
  }
  return { coins: 0, xp: 0, tier: "none" };
}