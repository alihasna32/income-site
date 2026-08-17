"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const WalletContext = createContext({ wallet: null, refresh: async () => {} });

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet);
      }
    } catch {
      // wallet stays as-is on transient errors
    }
  }, []);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    refresh();
  }, [refresh]);

  return (
    <WalletContext.Provider value={{ wallet, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}