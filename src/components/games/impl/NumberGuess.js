"use client";

import { useCallback, useEffect, useState } from "react";
import { GameFrame } from "@/components/games/impl/GameFrame";
import { cn } from "@/lib/utils/cn";

export function NumberGuess({ config, onFinish }) {
  const maxGuesses = config.max_guesses || 7;
  const min = config.min || 1;
  const max = config.max || 100;

  const [secret, setSecret] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [guessInput, setGuessInput] = useState("");
  const [ended, setEnded] = useState(false);
  const [message, setMessage] = useState("");

  const startGame = useCallback(() => {
    setSecret(Math.floor(Math.random() * (max - min + 1)) + min);
    setGuesses([]);
    setGuessInput("");
    setEnded(false);
    setMessage(`Guess a number between ${min} and ${max}. You have ${maxGuesses} guesses.`);
  }, [min, max, maxGuesses]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const submitGuess = (e) => {
    e.preventDefault();
    if (ended || secret === null) return;

    const value = Number(guessInput);
    if (!Number.isInteger(value) || value < min || value > max) {
      setMessage(`Enter a number between ${min} and ${max}.`);
      return;
    }

    const nextGuesses = [...guesses, value];
    setGuesses(nextGuesses);
    setGuessInput("");

    if (value === secret) {
      const score = Math.max(1, maxGuesses - nextGuesses.length + 1);
      setEnded(true);
      setMessage(`🎉 Correct! The number was ${secret}.`);
      onFinish(score, { guesses: nextGuesses.length, secret });
      return;
    }

    if (nextGuesses.length >= maxGuesses) {
      setEnded(true);
      setMessage(`Out of guesses! The number was ${secret}.`);
      onFinish(0, { guesses: nextGuesses.length, secret });
      return;
    }

    setMessage(`❌ ${value} is too ${value < secret ? "low" : "high"}. ${maxGuesses - nextGuesses.length} guesses left.`);
  };

  return (
    <GameFrame title="Number Guess" timerSeconds={null} score={guesses.length}>
      <div className="max-w-md mx-auto text-center">
        <p className={cn("text-sm font-medium", ended ? "text-plum font-bold" : "text-muted")}>
          {message}
        </p>

        {!ended && secret !== null && (
          <form onSubmit={submitGuess} className="mt-5 flex gap-2">
            <input
              type="number"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              min={min}
              max={max}
              className="input input-bordered flex-1"
              placeholder={`${min}–${max}`}
              aria-label="Your guess"
              autoFocus
            />
            <button type="submit" className="btn btn-primary">
              Guess
            </button>
          </form>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {guesses.map((g, i) => (
            <span
              key={i}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg font-mono text-sm font-bold",
                g === secret
                  ? "bg-success text-success-content"
                  : "bg-base-200 text-muted"
              )}
            >
              {g}
            </span>
          ))}
        </div>

        {ended && (
          <button onClick={startGame} className="btn btn-primary mt-5">
            Play again
          </button>
        )}
      </div>
    </GameFrame>
  );
}