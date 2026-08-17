import { randomInt } from "@/lib/utils/format";

function arithmetic(id, op, a, b) {
  let answer;
  let text;
  if (op === "+") {
    answer = a + b;
    text = `${a} + ${b}`;
  } else if (op === "-") {
    answer = a - b;
    text = `${a} − ${b}`;
  } else if (op === "×") {
    answer = a * b;
    text = `${a} × ${b}`;
  } else {
    answer = Math.round((a / b) * 100) / 100;
    text = `${a} ÷ ${b}`;
  }
  return { id, text, answer, type: "number" };
}

function percent(id) {
  const pct = randomInt(5, 25);
  const base = randomInt(40, 240);
  const answer = Math.round((pct / 100) * base * 100) / 100;
  return {
    id,
    text: `What is ${pct}% of ${base}?`,
    answer,
    type: "number",
  };
}

function sequence(id, difficulty) {
  const step = randomInt(2, 9);
  const start = randomInt(1, 20);
  const length = difficulty === "easy" ? 4 : 5;
  const seq = [];
  for (let i = 0; i < length; i++) seq.push(start + step * i);
  return {
    id,
    text: `What comes next? ${seq.join(", ")}, …`,
    answer: start + step * length,
    type: "number",
  };
}

function power(id) {
  const base = randomInt(2, 12);
  const exp = randomInt(2, 3);
  return {
    id,
    text: `${base}${exp === 2 ? "²" : "³"} = ?`,
    answer: Math.pow(base, exp),
    type: "number",
  };
}

function logic(id) {
  const a = randomInt(2, 9);
  const b = randomInt(2, 9);
  const answer = a * b;
  return {
    id,
    text: `If 1️⃣ + 1️⃣ = 2️⃣ and ${a} × ${b} = ❓, what is ❓?`,
    answer,
    type: "number",
  };
}

function quickAdd(id) {
  const a = randomInt(15, 99);
  const b = randomInt(15, 99);
  return { id, text: `Quick: ${a} + ${b}`, answer: a + b, type: "number" };
}

export function generateMathQuestions(difficulty, count) {
  const pool = [];
  const generators = [];

  if (difficulty === "easy") {
    generators.push(
      () => arithmetic(crypto.randomUUID(), "+", randomInt(10, 90), randomInt(10, 90)),
      () => arithmetic(crypto.randomUUID(), "−", randomInt(20, 99), randomInt(1, 19)),
      () => arithmetic(crypto.randomUUID(), "×", randomInt(2, 12), randomInt(2, 12)),
      () => sequence(crypto.randomUUID(), "easy")
    );
  } else if (difficulty === "medium") {
    generators.push(
      () => arithmetic(crypto.randomUUID(), "×", randomInt(6, 15), randomInt(6, 15)),
      () => arithmetic(crypto.randomUUID(), "÷", randomInt(12, 20) * randomInt(3, 9), randomInt(3, 9)),
      () => percent(crypto.randomUUID()),
      () => sequence(crypto.randomUUID(), "medium"),
      () => quickAdd(crypto.randomUUID())
    );
  } else if (difficulty === "hard") {
    generators.push(
      () => arithmetic(crypto.randomUUID(), "×", randomInt(11, 25), randomInt(11, 25)),
      () => percent(crypto.randomUUID()),
      () => sequence(crypto.randomUUID(), "hard"),
      () => power(crypto.randomUUID()),
      () => arithmetic(crypto.randomUUID(), "+", randomInt(100, 999), randomInt(100, 999))
    );
  } else {
    generators.push(
      () => percent(crypto.randomUUID()),
      () => sequence(crypto.randomUUID(), "hard"),
      () => power(crypto.randomUUID()),
      () => logic(crypto.randomUUID()),
      () => arithmetic(crypto.randomUUID(), "÷", randomInt(100, 400), randomInt(7, 20))
    );
  }

  while (pool.length < count) {
    const gen = generators[randomInt(0, generators.length - 1)];
    const question = gen();
    const text = question.text;
    if (!pool.some((q) => q.text === text)) pool.push(question);
  }

  return pool;
}