"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ROTATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches feedback and rotates through them every 5 minutes.
 * Uses a local ref to track state without causing re-renders on every tick.
 */
export function useFeedbackRotation() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(null);
  const tickRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
      setCurrentIndex(0);
      if (data.feedbacks?.length > 0) {
        setCurrent(data.feedbacks[0]);
      }
    } catch {
      // silently fail — don't disrupt the UI
    } finally {
      setLoading(false);
    }
  }, []);

  const rotate = useCallback(() => {
    setFeedbacks((prev) => {
      if (!prev || prev.length === 0) return prev;
      setCurrentIndex((idx) => {
        const next = (idx + 1) % prev.length;
        setCurrent(prev[next]);
        return next;
      });
      return prev;
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (feedbacks.length <= 1) return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(rotate, ROTATION_INTERVAL);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [feedbacks.length, rotate]);

  return { feedbacks, current, loading };
}