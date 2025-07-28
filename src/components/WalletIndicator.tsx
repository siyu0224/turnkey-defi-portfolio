"use client";

import { useWallet } from "@/contexts/WalletContext";
import { useRouter } from "next/navigation";

export default function WalletIndicator() {
  const { activeWallet, wallets } = useWallet();
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard");
  };

  if (!activeWallet) {
    return null;
  }

  const primaryAccount = activeWallet.accounts?.[0];

  return (
    <button
      onClick={handleClick}
      className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all"
    >
      <span className="text-lg">
        {activeWallet.primaryBlockchain === 'ethereum' ? '⟠' :
         activeWallet.primaryBlockchain === 'polygon' ? '⬡' :
         activeWallet.primaryBlockchain === 'arbitrum' ? '🔷' :
         activeWallet.primaryBlockchain === 'base' ? '🔵' :
         activeWallet.primaryBlockchain === 'optimism' ? '🔴' : '⚪'}
      </span>
      <div className="text-left">
        <p className="text-xs font-medium text-gray-700">{activeWallet.name}</p>
        {primaryAccount && (
          <p className="text-xs text-gray-500">
            {primaryAccount.address.slice(0, 6)}...{primaryAccount.address.slice(-4)}
          </p>
        )}
      </div>
      {wallets.length > 1 && (
        <div className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
          {wallets.length}
        </div>
      )}
    </button>
  );
}