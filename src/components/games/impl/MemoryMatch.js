"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/games/impl/GameFrame";
import { shuffle } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const EMOJIS = ["🍎", "🍌", "🍇", "🍒", "🍊", "🍉", "🥑", "🍍"];

export function MemoryMatch({ config, onFinish }) {
  const pairs = config.pairs || 6;
  const timeLimit = config.time_limit_seconds || 60;

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [ended, setEnded] = useState(false);
  const timerRef = useRef(null);

  const initialize = useCallback(() => {
    const pool = shuffle(EMOJIS).slice(0, pairs);
    const deck = shuffle([...pool, ...pool]).map((emoji, index) => ({
      id: index,
      emoji,
    }));
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setEnded(false);
    setLocked(false);
  }, [pairs]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (ended || matched.length === cards.length) {
      if (cards.length && matched.length === cards.length) {
        onFinish(matched.length / 2, { moves });
      }
    }
  }, [matched, cards, ended, moves, onFinish]);

  const flip = (card) => {
    if (locked || ended) return;
    if (flipped.length === 2) return;
    if (flipped.some((f) => f.id === card.id) || matched.some((m) => m === card.id)) return;

    const next = [...flipped, card];
    setFlipped(next);
    setMoves((m) => m + 1);

    if (next.length === 2) {
      setLocked(true);
      if (next[0].emoji === next[1].emoji) {
        setTimeout(() => {
          setMatched((prev) => [...prev, next[0].id, next[1].id]);
          setFlipped([]);
          setLocked(false);
        }, 450);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 750);
      }
    }
  };

  const handleExpire = useCallback(() => {
    if (ended) return;
    setEnded(true);
    onFinish(matched.length / 2, { moves, timedOut: true });
  }, [ended, matched, moves, onFinish]);

  const allMatched = cards.length > 0 && matched.length === cards.length;

  return (
    <GameFrame
      title="Memory Match"
      timerSeconds={allMatched ? null : timeLimit}
      onExpire={handleExpire}
      score={matched.length / 2}
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
        {cards.map((card) => {
          const isFlipped = flipped.some((f) => f.id === card.id);
          const isMatched = matched.includes(card.id);
          return (
            <button
              key={card.id}
              onClick={() => flip(card)}
              disabled={isMatched || isFlipped || ended}
              aria-label={`Card ${card.emoji}${isMatched ? " (matched)" : ""}`}
              className={cn(
                "flex aspect-[3/4] items-center justify-center rounded-xl border text-2xl sm:text-3xl font-bold transition-all duration-200",
                isMatched
                  ? "bg-success/15 border-success/40 text-success"
                  : isFlipped
                  ? "bg-gold/90 border-gold text-plum shadow-card"
                  : "bg-plum border-plum-dark text-neutral-content/30 hover:bg-plum-light active:scale-95"
              )}
            >
              {isFlipped || isMatched ? card.emoji : "?"}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted">
        <span>Moves: {moves}</span>
        <span>Pairs: {matched.length / 2}/{pairs}</span>
      </div>
    </GameFrame>
  );
}