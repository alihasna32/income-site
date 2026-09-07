"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL = 20 * 1000; // 20 seconds

/**
 * Pick `count` items at random from `list`. If the list has fewer than
 * `count` items, returns all of them (shuffled) without duplicating. The
 * caller compares the result against the previously displayed set to avoid
 * showing the exact same combination twice in a row.
 */
function pickRandomFeedbacks(list, count = 3) {
  if (list.length <= count) {
    return [...list].sort(() => Math.random() - 0.5);
  }
  return [...list].sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Generate `count` distinct random integers in [1, 20]. Used to assign each
 * selected feedback an independent "X min ago" label on every successful
 * fetch.
 */
function generateRandomFeedbackMinutes(count) {
  const values = [];
  while (values.length < count) {
    const value = Math.floor(Math.random() * 20) + 1;
    if (!values.includes(value)) values.push(value);
  }
  return values;
}

// Are two ordered lists the same items? Used to skip a selection that
// would re-show the exact same 3 in the same order as the previous cycle.
function sameSelection(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id) return false;
  }
  return true;
}

/**
 * Fetches the full feedback list every 20 seconds, randomly picks 3
 * (avoiding repeating the previous selection), and assigns each a random
 * 1–20 minute display value. Failed fetches keep the previous data and
 * previous random values intact.
 */
export function useFeedbackRotation() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const previousIdsRef = useRef([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let list;
      try {
        const res = await fetch("/api/feedback", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        list = Array.isArray(data.feedbacks) ? data.feedbacks : [];
      } catch {
        // keep previous data on failure
        return;
      }

      if (cancelled || list.length === 0) {
        if (!cancelled) setLoading(false);
        return;
      }

      // Pick a random 3 (or fewer if the list is smaller). Retry a few times
      // if we happened to draw the same 3 in the same order as last cycle.
      const count = Math.min(3, list.length);
      let selected = pickRandomFeedbacks(list, count);
      const previousIds = previousIdsRef.current;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (!sameSelection(selected, previousIds)) break;
        if (list.length <= count) break; // can't avoid repetition when list <= count
        selected = pickRandomFeedbacks(list, count);
      }
      previousIdsRef.current = selected.map((fb) => ({ id: fb.id }));

      const minutes = generateRandomFeedbackMinutes(selected.length);
      const withMinutes = selected.map((fb, i) => ({
        ...fb,
        displayMinutes: minutes[i],
      }));

      setFeedbacks(withMinutes);
      setCurrent(withMinutes[0] || null);
      setLoading(false);
    };

    load();
    const id = setInterval(load, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { feedbacks, current, loading };
}
