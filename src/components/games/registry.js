"use client";

import dynamic from "next/dynamic";

const LOADERS = {
  MemoryMatch: () => import("@/components/games/impl/MemoryMatch"),
  TapChallenge: () => import("@/components/games/impl/TapChallenge"),
  ReactionTest: () => import("@/components/games/impl/ReactionTest"),
  NumberGuess: () => import("@/components/games/impl/NumberGuess"),
  RockPaperScissors: () => import("@/components/games/impl/RockPaperScissors"),
  ColorMatch: () => import("@/components/games/impl/ColorMatch"),
  QuickQuiz: () => import("@/components/games/impl/QuickQuiz"),
  EmojiGuess: () => import("@/components/games/impl/EmojiGuess"),
  LuckyWheel: () => import("@/components/games/impl/LuckyWheel"),
  MysteryBox: () => import("@/components/games/impl/MysteryBox"),
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