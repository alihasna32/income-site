"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const DEFAULT_WALLET = {
  coins: 0,
  total_earned: 0,
  total_redeemed: 0,
  taka_balance: 0,
  total_taka_withdrawn: 0,
};

const WalletContext = createContext({ wallet: DEFAULT_WALLET, refresh: async () => {} });

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children, initialWallet }) {
  const [wallet, setWallet] = useState(() => ({ ...DEFAULT_WALLET, ...(initialWallet || {}) }));
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.wallet) setWallet(data.wallet);
      }
    } catch {
      // wallet stays as-is on transient errors
    }
  }, []);

  useEffect(() => {
    // Skip the initial fetch when we already have a server-provided value —
    // we only want client refreshes to keep the value in sync after a
    // conversion, withdrawal, or any other mutation.
    if (mounted.current) return;
    mounted.current = true;
    if (!initialWallet) refresh();
  }, [refresh, initialWallet]);

  return (
    <WalletContext.Provider value={{ wallet, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}
