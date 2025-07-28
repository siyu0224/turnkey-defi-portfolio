"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import MessageSigningCard from "@/components/MessageSigningCard";
import WalletSwitcher from "@/components/WalletSwitcher";

interface WalletInfo {
  id: string;
  name: string;
  accounts: {
    address: string;
    blockchain: string;
    curveType: string;
    addressFormat: string;
  }[];
  createdAt: string;
  primaryBlockchain: string;
  error?: string;
}

interface WalletAssets {
  walletId: string;
  address: string;
  blockchain: string;
  assets: {
    symbol: string;
    name: string;
    balance: string;
    value: number;
    price: number;
    change24h: number;
    icon: string;
  }[];
  nfts: { tokenId: string; name: string; collection: string; image: string; contractAddress: string }[];
  totalValue: number;
  assetCount: number;
  nftCount: number;
  lastUpdated: string;
}

interface SelectedWallet {
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
  const { wallets, setWallets, activeWallet, setActiveWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transactions' | 'settings'>('portfolio');
  const [selectedWallet, setSelectedWallet] = useState<SelectedWallet | null>(null);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [selectedWalletAssets, setSelectedWalletAssets] = useState<WalletAssets | null>(null);
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [showClaimWallet, setShowClaimWallet] = useState(false);
  const [allWallets, setAllWallets] = useState<{ id: string; name: string; createdAt: string; isMine: boolean; exported: boolean; imported: boolean }[]>([]);
  const [claimLoading, setClaimLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Mock portfolio data
  const [tokenBalances] = useState<TokenBalance[]>([
    { symbol: 'ETH', balance: '2.453', value: 4200.45, change24h: 3.2, icon: '🟢' },
    { symbol: 'USDC', balance: '1500.00', value: 1500.00, change24h: 0.1, icon: '🔵' },
    { symbol: 'UNI', balance: '45.8', value: 320.60, change24h: -2.1, icon: '🦄' },
    { symbol: 'LINK', balance: '78.2', value: 890.34, change24h: 5.4, icon: '🔗' }
  ]);

  const totalPortfolioValue = tokenBalances.reduce((sum, token) => sum + token.value, 0);

  const loadWallets = useCallback(async () => {
    setWalletsLoading(true);
    try {
      const response = await fetch('/api/list-wallets', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setWallets(data.wallets);
        // Auto-select first wallet if available
        if (data.wallets.length > 0 && !activeWallet) {
          const firstWallet = data.wallets[0];
          setActiveWallet(firstWallet);
          const address = firstWallet.accounts?.[0]?.address;
          if (address) {
            setSelectedWallet({
              walletId: firstWallet.id,
              address: address,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    } finally {
      setWalletsLoading(false);
    }
  }, [selectedWallet, activeWallet, setActiveWallet]);

  // Load wallets on component mount
  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  // Sync selectedWallet with activeWallet
  useEffect(() => {
    if (activeWallet) {
      const address = activeWallet.accounts?.[0]?.address;
      if (address) {
        setSelectedWallet({
          walletId: activeWallet.id,
          address: address,
        });
      }
    }
  }, [activeWallet]);

  const createWallet = async () => {
    if (!newWalletName.trim()) {
      alert('Please enter a wallet name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/create-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletName: newWalletName.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Reload wallets to show the new one
        await loadWallets();
        
        // Reload and set as active wallet
        const updatedWallets = await loadWallets();
        const newWalletInfo = wallets.find(w => w.id === data.wallet.id);
        if (newWalletInfo) {
          setActiveWallet(newWalletInfo);
        }
        
        // Add wallet creation transaction
        const newTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'receive',
          amount: 'New wallet created',
          token: 'WALLET',
          timestamp: new Date().toISOString(),
          status: 'completed'
        };
        setTransactions(prev => [newTransaction, ...prev]);
        
        // Reset form
        setNewWalletName('');
        setShowCreateWallet(false);
        
        alert(`Wallet "${data.wallet.name}" created successfully!`);
      } else {
        alert(`Failed to create wallet: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      alert('Failed to create wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signMessage = async (messageToSign: string, scenario: string) => {
    if (!selectedWallet) {
      alert('Please select a wallet first');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/sign-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSign,
          walletId: selectedWallet.walletId,
          address: selectedWallet.address,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Add signing transaction with scenario info
        const newTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'sign',
          amount: `${scenario} signed`,
          token: 'AUTH',
          timestamp: new Date().toISOString(),
          status: 'completed',
          signature: data.signature
        };
        setTransactions(prev => [newTransaction, ...prev]);
      }
    } catch (error) {
      console.error('Error signing message:', error);
      throw error; // Re-throw so the component can handle it
    } finally {
      setLoading(false);
    }
  };

  const selectWallet = (wallet: WalletInfo) => {
    setActiveWallet(wallet);
  };

  const loadAllWallets = async () => {
    setClaimLoading(true);
    try {
      const response = await fetch('/api/all-wallets', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setAllWallets(data.wallets);
        if (data.wallets.length > 0) {
          setShowClaimWallet(true);
        } else {
          alert('No wallets found in the organization');
        }
      }
    } catch (error) {
      console.error('Error loading all wallets:', error);
      alert('Failed to load wallets');
    } finally {
      setClaimLoading(false);
    }
  };

  const claimWallet = async (walletId: string) => {
    setClaimLoading(true);
    try {
      const response = await fetch('/api/claim-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletId }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully claimed wallet: ${walletId}`);
        setShowClaimWallet(false);
        // Reload user's wallets
        await loadWallets();
      } else {
        alert(`Failed to claim wallet: ${data.error}`);
      }
    } catch (error) {
      console.error('Error claiming wallet:', error);
      alert('Failed to claim wallet');
    } finally {
      setClaimLoading(false);
    }
  };

  const viewWalletDetails = async (wallet: WalletInfo) => {
    const primaryAccount = wallet.accounts?.[0];
    if (!primaryAccount?.address) {
      alert('No address found for this wallet');
      return;
    }

    setAssetsLoading(true);
    setShowWalletDetails(true);
    
    try {
      const response = await fetch('/api/wallet-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: wallet.id,
          address: primaryAccount.address,
          blockchain: primaryAccount.blockchain,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedWalletAssets(data.data);
      } else {
        alert(`Failed to load wallet assets: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching wallet assets:', error);
      alert('Failed to load wallet assets. Please try again.');
    } finally {
      setAssetsLoading(false);
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
              <WalletSwitcher />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {wallets.length} Wallet{wallets.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-600">● {walletsLoading ? 'Loading...' : 'Ready'}</p>
              </div>
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
        {/* Wallet Management Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Wallet Management</h2>
              <p className="text-gray-600 mt-1">
                {walletsLoading ? 'Loading wallets...' : 
                 wallets.length === 0 ? 'No wallets found. Create your first wallet to get started.' :
                 `You have ${wallets.length} wallet${wallets.length !== 1 ? 's' : ''}.`}
              </p>
            </div>
            <button
              onClick={() => setShowCreateWallet(true)}
              disabled={loading || walletsLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              + Create New Wallet
            </button>
          </div>

          {/* Wallet List */}
          {walletsLoading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-500">Loading your wallets...</p>
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-6xl mb-4 opacity-50">🛡️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Wallets Yet</h3>
              <p className="text-gray-600 mb-4">Create your first secure wallet or claim an existing one.</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowCreateWallet(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Create New Wallet
                </button>
                <button
                  onClick={loadAllWallets}
                  disabled={claimLoading}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all disabled:opacity-50"
                >
                  {claimLoading ? 'Loading...' : 'Claim Existing Wallet'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                If you created a wallet before, you can claim it to see it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet) => {
                const isSelected = activeWallet?.id === wallet.id;
                const primaryAccount = wallet.accounts?.[0];
                
                return (
                  <div
                    key={wallet.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 truncate">{wallet.name}</h3>
                      {isSelected && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    
                    {primaryAccount?.address ? (
                      <div className="space-y-2">
                        {/* Blockchain Type */}
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {wallet.primaryBlockchain === 'Ethereum' ? '🟢' :
                             wallet.primaryBlockchain === 'Bitcoin' ? '🟠' :
                             wallet.primaryBlockchain === 'Solana' ? '🟣' : '⚪'}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {wallet.primaryBlockchain}
                          </span>
                        </div>
                        
                        {/* Address */}
                        <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                          {primaryAccount.address.slice(0, 12)}...{primaryAccount.address.slice(-8)}
                        </p>
                        
                        {/* Account info */}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{wallet.accounts.length} account{wallet.accounts.length !== 1 ? 's' : ''}</span>
                          <span>{primaryAccount.curveType}</span>
                        </div>
                        
                        <p className="text-xs text-gray-400">
                          Created: {new Date(wallet.createdAt).toLocaleDateString()}
                        </p>
                        
                        {/* Action buttons */}
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectWallet(wallet);
                            }}
                            className={`flex-1 text-xs py-2 px-3 rounded transition-colors ${
                              isSelected
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              viewWalletDetails(wallet);
                            }}
                            className="flex-1 text-xs py-2 px-3 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                          >
                            View Assets
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-red-500">
                        {wallet.error || 'No accounts found'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Wallet Modal */}
        {showCreateWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Create New Wallet</h3>
                  <button
                    onClick={() => {
                      setShowCreateWallet(false);
                      setNewWalletName('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wallet Name
                    </label>
                    <input
                      type="text"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                      placeholder="e.g., My DeFi Wallet"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && createWallet()}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowCreateWallet(false);
                        setNewWalletName('');
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createWallet}
                      disabled={loading || !newWalletName.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
                    >
                      {loading ? 'Creating...' : 'Create Wallet'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {selectedWallet && (
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

                    <MessageSigningCard 
                      onSignMessage={signMessage}
                      isLoading={loading}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Wallet Details Modal */}
        {showWalletDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedWalletAssets?.walletId ? 
                        wallets.find(w => w.id === selectedWalletAssets.walletId)?.name || 'Wallet Details' :
                        'Wallet Details'
                      }
                    </h3>
                    {selectedWalletAssets && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-lg">
                          {selectedWalletAssets.blockchain === 'Ethereum' ? '🟢' :
                           selectedWalletAssets.blockchain === 'Bitcoin' ? '🟠' :
                           selectedWalletAssets.blockchain === 'Solana' ? '🟣' : '⚪'}
                        </span>
                        <span className="text-gray-600">{selectedWalletAssets.blockchain}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500 font-mono">
                          {selectedWalletAssets.address.slice(0, 16)}...{selectedWalletAssets.address.slice(-12)}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowWalletDetails(false);
                      setSelectedWalletAssets(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {assetsLoading ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-500">Loading wallet assets...</p>
                  </div>
                ) : selectedWalletAssets ? (
                  <div className="space-y-6">
                    {/* Portfolio Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Total Portfolio Value</h4>
                          <p className="text-3xl font-bold text-gray-900 mt-1">
                            ${selectedWalletAssets.totalValue.toLocaleString('en-US', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{selectedWalletAssets.assetCount} Assets</p>
                          {selectedWalletAssets.nftCount > 0 && (
                            <p className="text-sm text-gray-600">{selectedWalletAssets.nftCount} NFTs</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Assets List */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Assets</h4>
                      <div className="space-y-3">
                        {selectedWalletAssets.assets.map((asset, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <span className="text-2xl">{asset.icon}</span>
                              <div>
                                <p className="font-semibold text-gray-900">{asset.symbol}</p>
                                <p className="text-sm text-gray-600">{asset.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{asset.balance} {asset.symbol}</p>
                              <p className="text-sm text-gray-600">
                                ${asset.value.toLocaleString('en-US', { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2 
                                })}
                              </p>
                              <p className={`text-xs ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {asset.change24h >= 0 ? '+' : ''}{asset.change24h}% (24h)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* NFTs */}
                    {selectedWalletAssets.nfts.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">NFTs</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {selectedWalletAssets.nfts.map((nft, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="aspect-square bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                                <span className="text-4xl">🖼️</span>
                              </div>
                              <p className="font-medium text-sm text-gray-900 truncate">{nft.name}</p>
                              <p className="text-xs text-gray-600 truncate">{nft.collection}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Last Updated */}
                    <div className="text-center text-xs text-gray-400 pt-4 border-t">
                      Last updated: {selectedWalletAssets.lastUpdated ? 
                        new Date(selectedWalletAssets.lastUpdated).toLocaleString() : 
                        'Just now'
                      }
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">❌</div>
                    <p className="text-gray-500">Failed to load wallet assets</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Claim Wallet Modal */}
        {showClaimWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Claim Your Wallet</h3>
                  <button
                    onClick={() => {
                      setShowClaimWallet(false);
                      setAllWallets([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Select the wallet you created to claim it. You&apos;ll only see wallets you claim.
                </p>

                {claimLoading ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-500">Loading wallets...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allWallets.map((wallet) => (
                      <div
                        key={wallet.id}
                        className={`p-4 rounded-lg border-2 ${
                          wallet.isMine 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{wallet.name}</h4>
                            <p className="text-sm text-gray-600">ID: {wallet.id.slice(0, 8)}...{wallet.id.slice(-6)}</p>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(wallet.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {wallet.isMine ? (
                            <span className="bg-green-500 text-white px-4 py-2 rounded text-sm">
                              Already Claimed
                            </span>
                          ) : (
                            <button
                              onClick={() => claimWallet(wallet.id)}
                              disabled={claimLoading}
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                              Claim This Wallet
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 text-center text-sm text-gray-500">
                  Only claim wallets that you created. Claiming someone else&apos;s wallet won&apos;t give you access to it.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}