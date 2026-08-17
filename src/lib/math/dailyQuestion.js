// Deterministic daily question generator.
// The same (userId, date) always produces the same question, so the answer
// can be validated server-side without ever exposing it to the client.

function hashSeed(input) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

function makeQuestion(rng, difficulty) {
  const kind = randInt(rng, 0, 2);

  if (difficulty === "easy") {
    if (kind === 0) {
      const a = randInt(rng, 2, 50);
      const b = randInt(rng, 2, 50);
      return { question: `What is ${a} + ${b}?`, answer: String(a + b) };
    }
    if (kind === 1) {
      const a = randInt(rng, 10, 100);
      const b = randInt(rng, 1, a - 1);
      return { question: `What is ${a} − ${b}?`, answer: String(a - b) };
    }
    const a = randInt(rng, 2, 9);
    const b = randInt(rng, 2, 9);
    return { question: `What is ${a} × ${b}?`, answer: String(a * b) };
  }

  if (difficulty === "medium") {
    if (kind === 0) {
      const b = randInt(rng, 2, 12);
      const c = randInt(rng, 3, 12);
      return { question: `What is ${b * c} ÷ ${b}?`, answer: String(c) };
    }
    if (kind === 1) {
      const pct = [10, 20, 25, 50][randInt(rng, 0, 3)];
      const base = randInt(rng, 2, 10) * 20;
      return { question: `What is ${pct}% of ${base}?`, answer: String((base * pct) / 100) };
    }
    const start = randInt(rng, 1, 5);
    const step = randInt(rng, 2, 9);
    const terms = [start, start + step, start + 2 * step, start + 3 * step];
    return {
      question: `Continue the pattern: ${terms.join(", ")}, ?`,
      answer: String(start + 4 * step),
    };
  }

  if (kind === 0) {
    const a = randInt(rng, 4, 9);
    const b = randInt(rng, 3, 9);
    const c = randInt(rng, 2, 20);
    return { question: `What is ${a} × ${b} + ${c}?`, answer: String(a * b + c) };
  }
  if (kind === 1) {
    const base = randInt(rng, 5, 25) * 10;
    const off = [10, 20, 25, 50][randInt(rng, 0, 3)];
    return {
      question: `A ${base} coin item is ${off}% off. What is the sale price?`,
      answer: String(base - (base * off) / 100),
    };
  }
  const start = randInt(rng, 1, 6);
  const step = randInt(rng, 3, 15);
  const terms = [start, start + step, start + 2 * step, start + 3 * step, start + 4 * step];
  return {
    question: `Continue the pattern: ${terms.join(", ")}, ?`,
    answer: String(start + 5 * step),
  };
}

export function pickDifficulty(rng, weights = { easy: 60, medium: 30, hard: 10 }) {
  const total = weights.easy + weights.medium + weights.hard;
  const roll = rng() * total;
  if (roll < weights.easy) return "easy";
  if (roll < weights.easy + weights.medium) return "medium";
  return "hard";
}

export function generateDailyQuestion(userId, dateStr, weights) {
  const rng = mulberry32(hashSeed(`${userId}:${dateStr}`));
  const difficulty = pickDifficulty(rng, weights);
  return { difficulty, ...makeQuestion(rng, difficulty) };
}

export function normalizeAnswer(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const value = typeof raw === "number" ? raw : String(raw).trim();
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num;
}

export function answersMatch(submitted, expected) {
  const a = normalizeAnswer(submitted);
  const b = normalizeAnswer(expected);
  if (a === null || b === null) return false;
  return Math.abs(a - b) < 1e-9;
}