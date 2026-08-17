"use client";

import { useCallback, useState } from "react";
import { GameFrame } from "@/components/games/impl/GameFrame";
import { cn } from "@/lib/utils/cn";

const CHOICES = [
  { id: "rock", label: "🪨", name: "Rock" },
  { id: "paper", label: "📄", name: "Paper" },
  { id: "scissors", label: "✂️", name: "Scissors" },
];

const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

export function RockPaperScissors({ config, onFinish }) {
  const rounds = config.rounds || 3;

  const [playerWins, setPlayerWins] = useState(0);
  const [botWins, setBotWins] = useState(0);
  const [round, setRound] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [ended, setEnded] = useState(false);

  const play = (choice) => {
    if (ended) return;

    const bot = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    let result;
    if (BEATS[choice] === bot.id) {
      result = "win";
      setPlayerWins((w) => w + 1);
    } else if (BEATS[bot.id] === choice) {
      result = "lose";
      setBotWins((w) => w + 1);
    } else {
      result = "draw";
    }

    const player = CHOICES.find((c) => c.id === choice);
    setLastResult({ result, player, bot });

    const nextRound = round + 1;
    if (nextRound >= rounds) {
      setEnded(true);
      const wins = playerWins + (result === "win" ? 1 : 0);
      onFinish(wins, { rounds: wins, totalRounds: rounds });
    } else {
      setRound(nextRound);
    }
  };

  const showNext = lastResult && !ended && round + 1 < rounds;

  return (
    <GameFrame title="Rock Paper Scissors" timerSeconds={null} score={playerWins}>
      <div className="max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-6">
          <div>
            <p className="text-xs text-muted">You</p>
            <p className="text-2xl font-extrabold text-plum">{playerWins}</p>
          </div>
          <p className="text-xs text-muted uppercase font-bold">Round {Math.min(round + 1, rounds)}/{rounds}</p>
          <div>
            <p className="text-xs text-muted">Bot</p>
            <p className="text-2xl font-extrabold text-plum">{botWins}</p>
          </div>
        </div>

        {lastResult && (
          <div className="mt-5 rounded-box bg-base-200 p-4 animate-pop-in">
            <p className="text-3xl">
              {lastResult.player.label}{" "}
              <span className="text-base text-muted">vs</span>{" "}
              {lastResult.bot.label}
            </p>
            <p className={cn(
              "mt-2 text-sm font-bold",
              lastResult.result === "win" && "text-success",
              lastResult.result === "lose" && "text-error",
              lastResult.result === "draw" && "text-muted"
            )}>
              {lastResult.result === "win" && "You win this round!"}
              {lastResult.result === "lose" && "The bot takes this round."}
              {lastResult.result === "draw" && "It's a draw."}
            </p>
          </div>
        )}

        {!ended ? (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {CHOICES.map((choice) => (
              <button
                key={choice.id}
                onClick={() => play(choice.id)}
                className="btn btn-lg btn-outline flex flex-col items-center gap-1 py-4 h-auto hover:bg-primary/10 hover:border-primary"
              >
                <span className="text-3xl">{choice.label}</span>
                <span className="text-xs font-semibold">{choice.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <p className="font-bold text-plum">
              {playerWins > botWins
                ? "🏆 You beat the bot!"
                : playerWins === botWins
                ? "🤝 It's a tie series."
                : "🤖 The bot got you this time."}
            </p>
            <button
              onClick={() => {
                setPlayerWins(0);
                setBotWins(0);
                setRound(0);
                setLastResult(null);
                setEnded(false);
              }}
              className="btn btn-primary mt-4"
            >
              Rematch
            </button>
          </div>
        )}

        {showNext && <p className="mt-3 text-xs text-muted">Pick again for round {round + 2}</p>}
      </div>
    </GameFrame>
  );
}