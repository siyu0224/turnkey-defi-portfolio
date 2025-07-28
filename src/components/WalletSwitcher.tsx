"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";

export default function WalletSwitcher() {
  const { wallets, activeWallet, switchWallet } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeWallet || wallets.length <= 1) {
    return null;
  }

  const primaryAccount = activeWallet.accounts?.[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">
            {activeWallet.chains && activeWallet.chains.length > 1 ? '🌐' :
             activeWallet.primaryBlockchain === 'ethereum' ? '⟠' :
             activeWallet.primaryBlockchain === 'polygon' ? '⬡' :
             activeWallet.primaryBlockchain === 'arbitrum' ? '🔷' :
             activeWallet.primaryBlockchain === 'base' ? '🔵' :
             activeWallet.primaryBlockchain === 'optimism' ? '🔴' : '⚪'}
          </span>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{activeWallet.name}</p>
            {primaryAccount && (
              <p className="text-xs text-gray-500">
                {primaryAccount.address.slice(0, 6)}...{primaryAccount.address.slice(-4)}
                {activeWallet.chains && activeWallet.chains.length > 1 && (
                  <span className="ml-1 text-purple-600">({activeWallet.chains.length} chains)</span>
                )}
              </p>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2">
              <p className="text-xs text-gray-500 px-3 pt-2 pb-1">Switch Wallet</p>
              {wallets.map((wallet) => {
                const isActive = wallet.id === activeWallet.id;
                const account = wallet.accounts?.[0];
                
                return (
                  <button
                    key={wallet.id}
                    onClick={() => {
                      switchWallet(wallet.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {wallet.chains && wallet.chains.length > 1 ? '🌐' :
                           wallet.primaryBlockchain === 'ethereum' ? '⟠' :
                           wallet.primaryBlockchain === 'polygon' ? '⬡' :
                           wallet.primaryBlockchain === 'arbitrum' ? '🔷' :
                           wallet.primaryBlockchain === 'base' ? '🔵' :
                           wallet.primaryBlockchain === 'optimism' ? '🔴' : '⚪'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{wallet.name}</p>
                          {account && (
                            <p className="text-xs text-gray-500">
                              {account.address.slice(0, 8)}...{account.address.slice(-6)}
                              {wallet.chains && wallet.chains.length > 1 && (
                                <span className="ml-1 text-purple-600">({wallet.chains.length} chains)</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}