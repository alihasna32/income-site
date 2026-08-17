"use client";

import { useEffect, useState } from "react";
import { GameFrame } from "@/components/games/impl/GameFrame";
import { cn } from "@/lib/utils/cn";

const PUZZLES = [
  { emoji: "🌞☀️", answer: "Sunny", options: ["Rainy", "Sunny", "Cloudy", "Windy"] },
  { emoji: "🚀🌕", answer: "Moon landing", options: ["Space station", "Moon landing", "Alien visit", "Rocket race"] },
  { emoji: "🍕❤️", answer: "Love for pizza", options: ["Love for pizza", "Pizza party", "Italian food", "Cheese craving"] },
  { emoji: "🐱💤", answer: "Cat nap", options: ["Cat nap", "Sleeping cat", "Lazy day", "Bedtime"] },
  { emoji: "🎬🍿", answer: "Movie night", options: ["Movie night", "Cinema date", "Popcorn time", "Film festival"] },
  { emoji: "🏃💨", answer: "Running fast", options: ["Running fast", "Speed run", "Marathon", "Quick escape"] },
  { emoji: "🌊🏄", answer: "Surfing", options: ["Surfing", "Beach day", "Swimming", "Ocean fun"] },
  { emoji: "📚🦉", answer: "Smart student", options: ["Smart student", "Night owl", "Book lover", "Study time"] },
  { emoji: "☕🌅", answer: "Morning coffee", options: ["Morning coffee", "Sunrise café", "Wake up", "Breakfast time"] },
  { emoji: "🎂🎉", answer: "Birthday party", options: ["Birthday party", "Cake celebration", "Party time", "Special day"] },
];

export function EmojiGuess({ config, onFinish }) {
  const totalQuestions = config.questions || 6;

  const [order, setOrder] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const pool = [...PUZZLES].sort(() => Math.random() - 0.5).slice(0, totalQuestions);
    setOrder(pool);
    setIndex(0);
    setScore(0);
    setPicked(null);
    setEnded(false);
  }, [totalQuestions]);

  const current = order[index];

  const pick = (option) => {
    if (picked !== null || !current) return;
    setPicked(option);

    const isCorrect = option === current.answer;
    const newScore = score + (isCorrect ? 1 : 0);
    setScore(newScore);

    setTimeout(() => {
      if (index + 1 >= order.length) {
        setEnded(true);
        onFinish(newScore, { correct: newScore, total: order.length });
      } else {
        setIndex((i) => i + 1);
        setPicked(null);
      }
    }, 600);
  };

  return (
    <GameFrame title="Emoji Guess" timerSeconds={null} score={score}>
      <div className="max-w-lg mx-auto">
        {!ended && current ? (
          <>
            <p className="text-center text-xs text-muted">
              Puzzle {index + 1} of {order.length}
            </p>
            <p className="mt-4 text-center text-5xl select-none" aria-label="Emoji clue">
              {current.emoji}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {current.options.map((option) => {
                const isAnswer = picked !== null && option === current.answer;
                const isPicked = picked === option;
                return (
                  <button
                    key={option}
                    onClick={() => pick(option)}
                    disabled={picked !== null}
                    className={cn(
                      "btn justify-start text-left px-4 py-3 h-auto",
                      isAnswer
                        ? "btn-success"
                        : isPicked
                        ? "btn-error"
                        : "btn-outline hover:bg-primary/10 hover:border-primary"
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-4xl font-extrabold text-plum">{score}/{order.length}</p>
            <p className="mt-2 text-sm text-muted">guessed correctly</p>
          </div>
        )}
      </div>
    </GameFrame>
  );
}