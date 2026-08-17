"use client";

import { useCallback, useEffect, useState } from "react";
import { GameFrame } from "@/components/games/impl/GameFrame";
import { cn } from "@/lib/utils/cn";

const QUESTIONS = [
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars" },
  { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: "Pacific" },
  { q: "How many continents are there?", options: ["5", "6", "7", "8"], answer: "7" },
  { q: "What gas do plants absorb from the air?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: "Carbon dioxide" },
  { q: "Which animal is the tallest in the world?", options: ["Elephant", "Giraffe", "Ostrich", "Blue whale"], answer: "Giraffe" },
  { q: "What is Hâ‚‚O commonly known as?", options: ["Salt", "Sugar", "Water", "Air"], answer: "Water" },
  { q: "How many days are in a leap year?", options: ["364", "365", "366", "367"], answer: "366" },
  { q: "Which instrument has 88 keys?", options: ["Guitar", "Piano", "Violin", "Drums"], answer: "Piano" },
  { q: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Horse", "Ostrich"], answer: "Cheetah" },
  { q: "Which country is famous for the Eiffel Tower?", options: ["Italy", "England", "France", "Spain"], answer: "France" },
  { q: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], answer: "6" },
  { q: "What do bees produce?", options: ["Milk", "Sugar", "Honey", "Wax only"], answer: "Honey" },
];

export function QuickQuiz({ config, onFinish }) {
  const totalQuestions = config.questions || 8;
  const timeLimit = config.time_limit_seconds || 45;

  const [order, setOrder] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const pool = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, totalQuestions);
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
    }, 500);
  };

  const handleExpire = useCallback(() => {
    if (ended) return;
    setEnded(true);
    onFinish(score, { correct: score, total: order.length, timedOut: true });
  }, [ended, score, order.length, onFinish]);

  return (
    <GameFrame title="Quick Quiz" timerSeconds={ended ? null : timeLimit} onExpire={handleExpire} score={score}>
      <div className="max-w-lg mx-auto">
        {!ended && current ? (
          <>
            <p className="text-center text-xs text-muted">
              Question {index + 1} of {order.length}
            </p>
            <h3 className="mt-2 text-center text-lg font-bold text-plum">{current.q}</h3>
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
            <p className="mt-2 text-sm text-muted">questions correct</p>
          </div>
        )}
      </div>
    </GameFrame>
  );
}