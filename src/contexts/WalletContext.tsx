"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface WalletAccount {
  address: string;
  blockchain: string;
  curveType: string;
  addressFormat: string;
}

interface WalletInfo {
  id: string;
  name: string;
  accounts: WalletAccount[];
  createdAt: string;
  primaryBlockchain: string;
  chains?: string[];
  error?: string;
}

interface WalletContextType {
  wallets: WalletInfo[];
  activeWallet: WalletInfo | null;
  setActiveWallet: (wallet: WalletInfo | null) => void;
  setWallets: (wallets: WalletInfo[]) => void;
  switchWallet: (walletId: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [activeWallet, setActiveWallet] = useState<WalletInfo | null>(null);

  // Persist active wallet selection
  useEffect(() => {
    const storedWalletId = localStorage.getItem('activeWalletId');
    if (storedWalletId && wallets.length > 0) {
      const wallet = wallets.find(w => w.id === storedWalletId);
      if (wallet) {
        setActiveWallet(wallet);
      }
    }
  }, [wallets]);

  const handleSetActiveWallet = (wallet: WalletInfo | null) => {
    setActiveWallet(wallet);
    if (wallet) {
      localStorage.setItem('activeWalletId', wallet.id);
    } else {
      localStorage.removeItem('activeWalletId');
    }
  };

  const switchWallet = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      handleSetActiveWallet(wallet);
    }
  };

  return (
    <WalletContext.Provider value={{ 
      wallets, 
      activeWallet, 
      setActiveWallet: handleSetActiveWallet, 
      setWallets,
      switchWallet 
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}