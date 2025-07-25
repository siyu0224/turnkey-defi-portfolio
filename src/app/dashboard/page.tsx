"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface WalletInfo {
  walletId: string;
  address: string;
  activity?: unknown;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  value: number;
  change24h: number;
  icon: string;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'sign';
  amount: string;
  token: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  signature?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transactions' | 'settings'>('portfolio');
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Mock portfolio data
  const [tokenBalances] = useState<TokenBalance[]>([
    { symbol: 'ETH', balance: '2.453', value: 4200.45, change24h: 3.2, icon: '🟢' },
    { symbol: 'USDC', balance: '1500.00', value: 1500.00, change24h: 0.1, icon: '🔵' },
    { symbol: 'UNI', balance: '45.8', value: 320.60, change24h: -2.1, icon: '🦄' },
    { symbol: 'LINK', balance: '78.2', value: 890.34, change24h: 5.4, icon: '🔗' }
  ]);

  const totalPortfolioValue = tokenBalances.reduce((sum, token) => sum + token.value, 0);

  const createWallet = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletName: `defi-wallet-${Date.now()}`,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const walletId = data.activity?.result?.createWalletResult?.walletId;
        const address = data.activity?.result?.createWalletResult?.addresses?.[0];
        
        setWalletInfo({
          walletId,
          address,
          activity: data.activity
        });
        
        // Add wallet creation transaction
        const newTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'receive',
          amount: '0.00',
          token: 'ETH',
          timestamp: new Date().toISOString(),
          status: 'completed'
        };
        setTransactions(prev => [newTransaction, ...prev]);
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const signMessage = async () => {
    if (!message.trim()) {
      alert("Please enter a message to sign");
      return;
    }

    if (!walletInfo) {
      alert("Please create a wallet first");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("/api/sign-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          walletId: walletInfo.walletId,
          address: walletInfo.address,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Add signing transaction
        const newTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'sign',
          amount: message.substring(0, 20) + '...',
          token: 'MSG',
          timestamp: new Date().toISOString(),
          status: 'completed',
          signature: data.signature
        };
        setTransactions(prev => [newTransaction, ...prev]);
        setMessage(""); // Clear the message input
      }
    } catch (error) {
      console.error("Error signing message:", error);
    } finally {
      setLoading(false);
    }
  };

  const mockSwap = () => {
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'swap',
      amount: '100 USDC → 0.025 ETH',
      token: 'SWAP',
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    setTimeout(() => {
      setTransactions(prev => 
        prev.map(tx => tx.id === newTransaction.id ? {...tx, status: 'completed'} : tx)
      );
    }, 3000);
  };

  const goBack = () => {
    router.push("/");
  };

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DeFi Portfolio</h1>
                <p className="text-sm text-gray-500">Powered by Turnkey</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || user.email || 'User'}
                  </p>
                  <p className="text-xs text-blue-600">
                    ● {user.authMethod === 'google' ? 'Google' : 
                        user.authMethod === 'passkey' ? 'Passkey' : 
                        'Guest'}
                  </p>
                </div>
              )}
              {walletInfo && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}
                  </p>
                  <p className="text-xs text-green-600">● Wallet Connected</p>
                </div>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={goBack}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Back to Home
                </button>
                {isAuthenticated && (
                  <button
                    onClick={handleSignOut}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Connection Banner */}
        {!walletInfo && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to DeFi Portfolio</h2>
                <p className="text-blue-100 mb-4">
                  Create your secure wallet powered by Turnkey&apos;s infrastructure to start managing your DeFi assets.
                </p>
                <button
                  onClick={createWallet}
                  disabled={loading}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50"
                >
                  {loading ? "Creating Wallet..." : "Create Secure Wallet"}
                </button>
              </div>
              <div className="text-6xl opacity-20">🛡️</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {walletInfo && (
          <>
            {/* Portfolio Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Portfolio Overview</h2>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-green-600">+2.3% (24h)</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tokenBalances.map((token) => (
                  <div key={token.symbol} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{token.icon}</span>
                        <span className="font-semibold text-gray-900">{token.symbol}</span>
                      </div>
                      <span className={`text-sm ${token.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{token.balance}</p>
                    <p className="text-sm text-gray-600">
                      ${token.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-lg mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'portfolio', label: 'Portfolio', icon: '📊' },
                    { id: 'transactions', label: 'Transactions', icon: '📝' },
                    { id: 'settings', label: 'Security', icon: '🔒' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'portfolio' | 'transactions' | 'settings')}
                      className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={mockSwap}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                      >
                        <div className="text-2xl mb-2">🔄</div>
                        <div className="font-semibold">Swap Tokens</div>
                        <div className="text-sm opacity-90">Exchange your assets</div>
                      </button>
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                        <div className="text-2xl mb-2">💰</div>
                        <div className="font-semibold">Earn Yield</div>
                        <div className="text-sm opacity-90">Stake & earn rewards</div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                        <div className="text-2xl mb-2">🏦</div>
                        <div className="font-semibold">Lend Assets</div>
                        <div className="text-sm opacity-90">Supply to protocols</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                      <span className="text-sm text-gray-500">{transactions.length} transactions</span>
                    </div>
                    
                    {transactions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">📝</div>
                        <p className="text-gray-500">No transactions yet</p>
                        <p className="text-sm text-gray-400">Your transaction history will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                tx.type === 'send' ? 'bg-red-100 text-red-600' :
                                tx.type === 'receive' ? 'bg-green-100 text-green-600' :
                                tx.type === 'swap' ? 'bg-blue-100 text-blue-600' :
                                'bg-purple-100 text-purple-600'
                              }`}>
                                {tx.type === 'send' ? '↗️' : 
                                 tx.type === 'receive' ? '↘️' : 
                                 tx.type === 'swap' ? '🔄' : '✍️'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 capitalize">{tx.type}</p>
                                <p className="text-sm text-gray-600">{tx.amount}</p>
                                {tx.signature && (
                                  <p className="text-xs text-gray-400">
                                    Sig: {tx.signature.slice(0, 16)}...
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                                tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {tx.status}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(tx.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600">🛡️</span>
                            </div>
                            <span className="font-semibold text-green-800">HSM Security</span>
                          </div>
                          <p className="text-sm text-green-700">
                            Your private keys are secured in hardware security modules
                          </p>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600">🔐</span>
                            </div>
                            <span className="font-semibold text-blue-800">MPC Technology</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            Multi-party computation ensures key security
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Message Signing</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Sign messages securely to prove ownership or authenticate with dApps
                      </p>
                      
                      <div className="space-y-4">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Enter message to sign (e.g., 'Authenticate with MyDApp')"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                        
                        <button
                          onClick={signMessage}
                          disabled={loading || !message.trim()}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          {loading ? "Signing..." : "🖋️ Sign Message"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}