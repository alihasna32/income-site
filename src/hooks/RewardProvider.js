"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { RewardCoinAnimation } from "@/components/shared/RewardCoinAnimation";

const RewardContext = createContext({
  showReward: () => {},
});

export function useReward() {
  return useContext(RewardContext);
}

export function RewardProvider({ children }) {
  const [rewards, setRewards] = useState([]);
  const counterRef = useRef(0);

  const showReward = useCallback((amount, source = "reward") => {
    if (!amount || amount <= 0) return;
    const id = ++counterRef.current;
    setRewards((prev) => [...prev, { id, amount, source, createdAt: Date.now() }]);
    // Auto-dismiss after animation completes
    setTimeout(() => {
      setRewards((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <RewardContext.Provider value={{ showReward }}>
      {children}
      {rewards.map((reward) => (
        <RewardCoinAnimation
          key={reward.id}
          id={reward.id}
          amount={reward.amount}
          source={reward.source}
          onDismiss={dismiss}
        />
      ))}
    </RewardContext.Provider>
  );
}
