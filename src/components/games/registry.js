"use client";

import dynamic from "next/dynamic";

const LOADERS = {
  MemoryMatch: () => import("@/components/games/impl/MemoryMatch").then((m) => m.MemoryMatch),
  TapChallenge: () => import("@/components/games/impl/TapChallenge").then((m) => m.TapChallenge),
  ReactionTest: () => import("@/components/games/impl/ReactionTest").then((m) => m.ReactionTest),
  NumberGuess: () => import("@/components/games/impl/NumberGuess").then((m) => m.NumberGuess),
  RockPaperScissors: () =>
    import("@/components/games/impl/RockPaperScissors").then((m) => m.RockPaperScissors),
  ColorMatch: () => import("@/components/games/impl/ColorMatch").then((m) => m.ColorMatch),
  QuickQuiz: () => import("@/components/games/impl/QuickQuiz").then((m) => m.QuickQuiz),
  EmojiGuess: () => import("@/components/games/impl/EmojiGuess").then((m) => m.EmojiGuess),
  LuckyWheel: () => import("@/components/games/impl/LuckyWheel").then((m) => m.LuckyWheel),
  MysteryBox: () => import("@/components/games/impl/MysteryBox").then((m) => m.MysteryBox),
};

const CACHE = {};

export function getGameComponent(name) {
  if (!name) return null;
  if (!CACHE[name]) {
    if (!LOADERS[name]) return null;
    CACHE[name] = dynamic(LOADERS[name], {
      ssr: false,
      loading: () => (
        <div className="skeleton h-72 w-full rounded-box" />
      ),
    });
  }
  return CACHE[name];
}