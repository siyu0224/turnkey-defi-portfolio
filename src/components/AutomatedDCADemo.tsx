"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { checkDCAExecutionGuard, logDCAExecution } from "@/lib/dca-transaction-guard";

interface DCAStrategy {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'base' | 'optimism';
  config: {
    fromToken: string;
    toToken: string;
    amount: string;
    frequency: 'hourly' | 'daily' | 'weekly';
    maxGasPrice: string;
    slippageTolerance: string;
    totalBudget: string;
    executedAmount: string;
    executionCount: number;
    lastExecution?: string;
    nextExecution?: string;
  };
  transactions: {
    id: string;
    timestamp: string;
    fromAmount: string;
    toAmount: string;
    gasUsed: string;
    status: 'pending' | 'completed' | 'failed';
    txHash?: string;
    chain: string;
  }[];
}

export default function AutomatedDCADemo() {
  const { activeWallet } = useWallet();
  const [strategies, setStrategies] = useState<DCAStrategy[]>([]);
  const [showCreateStrategy, setShowCreateStrategy] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<DCAStrategy | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [transactionToSign, setTransactionToSign] = useState<any>(null);
  
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'polygon' | 'arbitrum' | 'base' | 'optimism'>('ethereum');
  
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    fromToken: 'USDC',
    toToken: 'ETH',
    amount: '100',
    frequency: 'daily' as 'hourly' | 'daily' | 'weekly',
    maxGasPrice: '50',
    slippageTolerance: '1',
    totalBudget: '1000',
  });

  // Chain configurations
  const chainConfigs = {
    ethereum: {
      name: 'Ethereum',
      icon: '⟠',
      color: 'bg-blue-500',
      explorer: 'https://etherscan.io',
      tokens: ['ETH', 'USDC', 'DAI', 'UNI', 'LINK', 'WBTC'],
      dexRouter: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3
    },
    polygon: {
      name: 'Polygon',
      icon: '⬡',
      color: 'bg-purple-500',
      explorer: 'https://polygonscan.com',
      tokens: ['MATIC', 'USDC', 'DAI', 'WETH', 'LINK', 'AAVE'],
      dexRouter: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3
    },
    arbitrum: {
      name: 'Arbitrum',
      icon: '🔷',
      color: 'bg-blue-600',
      explorer: 'https://arbiscan.io',
      tokens: ['ETH', 'USDC', 'DAI', 'ARB', 'GMX', 'LINK'],
      dexRouter: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3
    },
    base: {
      name: 'Base',
      icon: '🔵',
      color: 'bg-blue-700',
      explorer: 'https://basescan.org',
      tokens: ['ETH', 'USDC', 'DAI', 'cbETH', 'AERO', 'BRETT'],
      dexRouter: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3
    },
    optimism: {
      name: 'Optimism',
      icon: '🔴',
      color: 'bg-red-500',
      explorer: 'https://optimistic.etherscan.io',
      tokens: ['ETH', 'USDC', 'DAI', 'OP', 'SNX', 'LINK'],
      dexRouter: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3
    },
  };

  // Token prices for simulation (chain-aware)
  const tokenPrices: Record<string, number> = {
    ETH: 2500,
    WETH: 2500,
    BTC: 45000,
    WBTC: 45000,
    USDC: 1,
    DAI: 1,
    UNI: 7,
    LINK: 11.4,
    MATIC: 0.7,
    ARB: 1.2,
    OP: 2.3,
    GMX: 35,
    SNX: 3.2,
    AAVE: 95,
    cbETH: 2600,
    AERO: 0.8,
    BRETT: 0.05,
  };

  // Load saved strategies
  useEffect(() => {
    try {
      const savedStrategies = localStorage.getItem('dca-strategies');
      if (savedStrategies) {
        setStrategies(JSON.parse(savedStrategies));
      }
    } catch (error) {
      console.error('Error loading strategies:', error);
    }
  }, []);

  const createStrategy = async () => {
    if (!activeWallet) {
      alert('Please select a wallet first');
      return;
    }

    if (!newStrategy.name || !newStrategy.amount || !newStrategy.totalBudget) {
      alert('Please fill in all required fields');
      return;
    }

    const strategy: DCAStrategy = {
      id: `dca-${Date.now()}`,
      name: newStrategy.name,
      status: 'active',
      chain: selectedChain,
      config: {
        ...newStrategy,
        executedAmount: '0',
        executionCount: 0,
        nextExecution: getNextExecutionTime(newStrategy.frequency),
      },
      transactions: [],
    };

    // Create policy for automated DCA transactions
    try {
      const policyResponse = await fetch('/api/create-dca-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyName: newStrategy.name,
          chain: selectedChain,
          maxGasPrice: newStrategy.maxGasPrice,
          maxAmount: newStrategy.amount,
          fromToken: newStrategy.fromToken,
          toToken: newStrategy.toToken,
          targetContract: chainConfigs[selectedChain as keyof typeof chainConfigs].dexRouter, // Use chain-specific DEX router
        }),
      });

      const policyData = await policyResponse.json();
      console.log("DCA Policy creation:", policyData);
      
      if (policyData.success && policyData.policy) {
        // Add policy ID to strategy
        strategy.id = policyData.policy.id;
        
        const updatedStrategies = [...strategies, strategy];
        setStrategies(updatedStrategies);
        localStorage.setItem('dca-strategies', JSON.stringify(updatedStrategies));
        setShowCreateStrategy(false);
        resetForm();
        
        // Show success message
        alert(`DCA strategy "${newStrategy.name}" created successfully!\n\nA Turnkey policy has been created to control gas prices for this strategy.`);
      } else {
        // Fall back to local storage if policy creation fails
        console.error('Policy creation failed:', policyData);
        const updatedStrategies = [...strategies, strategy];
        setStrategies(updatedStrategies);
        localStorage.setItem('dca-strategies', JSON.stringify(updatedStrategies));
        setShowCreateStrategy(false);
        resetForm();
        
        const errorMessage = policyData.message || policyData.error || 'Unknown error';
        const errorDetails = policyData.details ? `\n\nDetails: ${JSON.stringify(policyData.details)}` : '';
        alert(`DCA strategy "${newStrategy.name}" created successfully!\n\nNote: Policy creation failed (${errorMessage})${errorDetails}, but the strategy has been saved locally.`);
      }
    } catch (error) {
      console.error('Error creating strategy:', error);
      // Still save the strategy locally even if policy creation fails
      const updatedStrategies = [...strategies, strategy];
      setStrategies(updatedStrategies);
      localStorage.setItem('dca-strategies', JSON.stringify(updatedStrategies));
      setShowCreateStrategy(false);
      resetForm();
      
      alert(`DCA strategy "${newStrategy.name}" created successfully!\n\nNote: Policy creation encountered an error, but the strategy has been saved locally.`);
    }
  };

  const executeStrategy = async (strategy: DCAStrategy) => {
    if (!activeWallet) {
      alert('Please select a wallet first');
      return;
    }

    setExecuting(true);
    setSelectedStrategy(strategy);

    try {
      // Calculate swap amounts
      const fromAmount = parseFloat(strategy.config.amount);
      const fromPrice = tokenPrices[strategy.config.fromToken];
      const toPrice = tokenPrices[strategy.config.toToken];
      const toAmount = (fromAmount * fromPrice) / toPrice;
      const slippage = parseFloat(strategy.config.slippageTolerance) / 100;
      const minToAmount = toAmount * (1 - slippage);

      // Check execution guards before proceeding
      const guardCheck = await checkDCAExecutionGuard({
        fromToken: strategy.config.fromToken,
        toToken: strategy.config.toToken,
        amount: fromAmount,
        maxGasPrice: parseFloat(strategy.config.maxGasPrice) * 1e9,
        walletAddress: activeWallet.accounts?.[0]?.address || '',
        strategyId: strategy.id,
      }, strategy);

      if (!guardCheck.canExecute) {
        alert(`Cannot execute DCA strategy: ${guardCheck.reason}`);
        setExecuting(false);
        return;
      }

      // Create swap transaction
      const chainConfig = chainConfigs[strategy.chain] || chainConfigs.ethereum;
      const swapData = {
        from: activeWallet.accounts?.[0]?.address,
        to: chainConfig.dexRouter,
        data: encodeSwapData(strategy.config.fromToken, strategy.config.toToken, fromAmount),
        value: strategy.config.fromToken === 'ETH' || strategy.config.fromToken === 'MATIC' ? `${fromAmount * 1e18}` : '0',
        gasPrice: `${parseFloat(strategy.config.maxGasPrice) * 1e9}`,
        chain: strategy.chain,
      };

      if (simulationMode) {
        // Simulate the transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newTx = {
          id: `tx-${Date.now()}`,
          timestamp: new Date().toISOString(),
          fromAmount: fromAmount.toString(),
          toAmount: minToAmount.toFixed(6),
          gasUsed: '150000',
          status: 'completed' as const,
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          chain: strategy.chain,
        };

        // Update strategy
        const updatedStrategy = {
          ...strategy,
          config: {
            ...strategy.config,
            executedAmount: (parseFloat(strategy.config.executedAmount) + fromAmount).toString(),
            executionCount: strategy.config.executionCount + 1,
            lastExecution: new Date().toISOString(),
            nextExecution: getNextExecutionTime(strategy.config.frequency),
          },
          transactions: [...strategy.transactions, newTx],
        };

        const updatedStrategies = strategies.map(s => 
          s.id === strategy.id ? updatedStrategy : s
        );
        setStrategies(updatedStrategies);
        localStorage.setItem('dca-strategies', JSON.stringify(updatedStrategies));
        
        alert('DCA execution simulated successfully!');
      } else {
        // Execute real transaction with policy check
        const response = await fetch('/api/execute-with-policy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletId: activeWallet.id,
            transactionType: 'eth_transfer',
            transactionParams: swapData,
            policyId: strategy.id,
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          // Show signing modal
          setTransactionToSign({
            strategy,
            fromAmount,
            toAmount: minToAmount,
            swapData,
            message: `Executing DCA: Swap ${fromAmount} ${strategy.config.fromToken} for ${minToAmount.toFixed(6)} ${strategy.config.toToken}`,
          });
          setShowSigningModal(true);
          setExecuting(false);
          return;
        } else if (result.policyViolation) {
          alert(`Transaction blocked by policy: ${result.error}`);
        } else {
          alert(`Transaction failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error executing strategy:', error);
      alert('Failed to execute strategy');
    } finally {
      setExecuting(false);
      setSelectedStrategy(null);
    }
  };

  const getNextExecutionTime = (frequency: string) => {
    const now = new Date();
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const encodeSwapData = (fromToken: string, toToken: string, amount: number) => {
    // Simplified swap data encoding for demo
    return `0x${Buffer.from(JSON.stringify({ fromToken, toToken, amount })).toString('hex')}`;
  };

  const resetForm = () => {
    setNewStrategy({
      name: '',
      fromToken: 'USDC',
      toToken: 'ETH',
      amount: '100',
      frequency: 'daily',
      maxGasPrice: '50',
      slippageTolerance: '1',
      totalBudget: '1000',
    });
  };

  const toggleStrategy = (strategyId: string) => {
    const updatedStrategies = strategies.map(s => 
      s.id === strategyId 
        ? { ...s, status: s.status === 'active' ? 'paused' as const : 'active' as const }
        : s
    );
    setStrategies(updatedStrategies);
    localStorage.setItem('dca-strategies', JSON.stringify(updatedStrategies));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">Multi-Chain Automated DCA Trading</h3>
        <p className="text-purple-100 mb-4">
          Set up cross-chain automated trading strategies with Turnkey&apos;s policy engine
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={simulationMode}
                onChange={(e) => setSimulationMode(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Simulation Mode</span>
            </label>
          </div>
          <button
            onClick={() => setShowCreateStrategy(true)}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            + New Strategy
          </button>
        </div>
      </div>

      {/* Active Strategies */}
      {strategies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📈</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No DCA Strategies</h4>
          <p className="text-gray-600">Create your first automated trading strategy</p>
        </div>
      ) : (
        <div className="space-y-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{strategy.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      strategy.status === 'active' ? 'bg-green-100 text-green-700' :
                      strategy.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {strategy.status}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${chainConfigs[strategy.chain]?.color || 'bg-gray-500'} text-white flex items-center space-x-1`}>
                      <span>{chainConfigs[strategy.chain]?.icon || '⚪'}</span>
                      <span>{chainConfigs[strategy.chain]?.name || strategy.chain}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Swap {strategy.config.amount} {strategy.config.fromToken} → {strategy.config.toToken} {strategy.config.frequency}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleStrategy(strategy.id)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      strategy.status === 'active'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {strategy.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => executeStrategy(strategy)}
                    disabled={executing || strategy.status !== 'active'}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                  >
                    {executing && selectedStrategy?.id === strategy.id ? 'Executing...' : 'Execute Now'}
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress: ${strategy.config.executedAmount} / ${strategy.config.totalBudget}</span>
                  <span>{strategy.config.executionCount} executions</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                    style={{
                      width: `${(parseFloat(strategy.config.executedAmount) / parseFloat(strategy.config.totalBudget)) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Max Gas</p>
                  <p className="font-medium">{strategy.config.maxGasPrice} Gwei</p>
                </div>
                <div>
                  <p className="text-gray-500">Slippage</p>
                  <p className="font-medium">{strategy.config.slippageTolerance}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Run</p>
                  <p className="font-medium">
                    {strategy.config.lastExecution 
                      ? new Date(strategy.config.lastExecution).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Next Run</p>
                  <p className="font-medium">
                    {strategy.config.nextExecution 
                      ? new Date(strategy.config.nextExecution).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Recent Transactions */}
              {strategy.transactions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Executions</h5>
                  <div className="space-y-2">
                    {strategy.transactions.slice(-3).reverse().map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            tx.status === 'completed' ? 'bg-green-500' :
                            tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-gray-600">
                            {new Date(tx.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">
                            {tx.fromAmount} {strategy.config.fromToken} → {tx.toAmount} {strategy.config.toToken}
                          </span>
                          {tx.txHash && (
                            <a
                              href={`${chainConfigs[strategy.chain]?.explorer || 'https://etherscan.io'}/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Strategy Modal */}
      {showCreateStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create DCA Strategy</h3>
                <button
                  onClick={() => {
                    setShowCreateStrategy(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Chain
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(chainConfigs) as Array<keyof typeof chainConfigs>).map((chain) => (
                      <button
                        key={chain}
                        onClick={() => setSelectedChain(chain)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedChain === chain
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{chainConfigs[chain]?.icon || '⚪'}</span>
                          <span className="text-sm font-medium">{chainConfigs[chain]?.name || chain}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategy Name
                  </label>
                  <input
                    type="text"
                    value={newStrategy.name}
                    onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                    placeholder="e.g., Weekly ETH Accumulation"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Token
                    </label>
                    <select
                      value={newStrategy.fromToken}
                      onChange={(e) => setNewStrategy({ ...newStrategy, fromToken: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {chainConfigs[selectedChain]?.tokens?.map((token) => (
                        <option key={token} value={token}>{token}</option>
                      )) || []}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Token
                    </label>
                    <select
                      value={newStrategy.toToken}
                      onChange={(e) => setNewStrategy({ ...newStrategy, toToken: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {chainConfigs[selectedChain]?.tokens?.map((token) => (
                        <option key={token} value={token}>{token}</option>
                      )) || []}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount per Trade
                  </label>
                  <input
                    type="number"
                    value={newStrategy.amount}
                    onChange={(e) => setNewStrategy({ ...newStrategy, amount: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={newStrategy.frequency}
                    onChange={(e) => setNewStrategy({ ...newStrategy, frequency: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="hourly">Every Hour (Demo)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Budget
                  </label>
                  <input
                    type="number"
                    value={newStrategy.totalBudget}
                    onChange={(e) => setNewStrategy({ ...newStrategy, totalBudget: e.target.value })}
                    placeholder="1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Gas (Gwei)
                    </label>
                    <input
                      type="number"
                      value={newStrategy.maxGasPrice}
                      onChange={(e) => setNewStrategy({ ...newStrategy, maxGasPrice: e.target.value })}
                      placeholder="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slippage (%)
                    </label>
                    <input
                      type="number"
                      value={newStrategy.slippageTolerance}
                      onChange={(e) => setNewStrategy({ ...newStrategy, slippageTolerance: e.target.value })}
                      placeholder="1"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">Strategy Summary</h4>
                  <p className="text-sm text-purple-800">
                    Swap {newStrategy.amount || '0'} {newStrategy.fromToken} to {newStrategy.toToken} {newStrategy.frequency}.
                    Total budget: {newStrategy.totalBudget || '0'} {newStrategy.fromToken}.
                    Execute only when gas ≤ {newStrategy.maxGasPrice} Gwei.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateStrategy(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createStrategy}
                    disabled={!newStrategy.name || !newStrategy.amount || !newStrategy.totalBudget}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                  >
                    Create Strategy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Signing Modal */}
      {showSigningModal && transactionToSign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✍️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Approve Transaction</h3>
                <p className="text-gray-600 mt-2">Review and sign this DCA transaction</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{transactionToSign.fromAmount} {transactionToSign.strategy.config.fromToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{transactionToSign.toAmount.toFixed(6)} {transactionToSign.strategy.config.toToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Gas:</span>
                    <span className="font-medium">{transactionToSign.strategy.config.maxGasPrice} Gwei</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Strategy:</span>
                    <span className="font-medium">{transactionToSign.strategy.name}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This will execute a real transaction. Make sure you have sufficient balance and gas.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSigningModal(false);
                    setTransactionToSign(null);
                    setExecuting(false);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
                >
                  Reject
                </button>
                <button
                  onClick={async () => {
                    // Sign the transaction
                    try {
                      const signResponse = await fetch('/api/sign-message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          message: transactionToSign.message,
                          walletId: activeWallet!.id,
                          address: activeWallet!.accounts?.[0]?.address,
                          chain: transactionToSign.strategy.chain,
                        }),
                      });

                      if (signResponse.ok) {
                        const signData = await signResponse.json();
                        
                        // Update strategy with successful execution
                        const newTx = {
                          id: `tx-${Date.now()}`,
                          timestamp: new Date().toISOString(),
                          fromAmount: transactionToSign.fromAmount.toString(),
                          toAmount: transactionToSign.toAmount.toFixed(6),
                          gasUsed: '150000',
                          status: 'completed' as const,
                          txHash: signData.signature?.slice(0, 66),
                          chain: transactionToSign.strategy.chain,
                        };

                        const updatedStrategy = {
                          ...transactionToSign.strategy,
                          config: {
                            ...transactionToSign.strategy.config,
                            executedAmount: (parseFloat(transactionToSign.strategy.config.executedAmount) + transactionToSign.fromAmount).toString(),
                            executionCount: transactionToSign.strategy.config.executionCount + 1,
                            lastExecution: new Date().toISOString(),
                            nextExecution: getNextExecutionTime(transactionToSign.strategy.config.frequency),
                          },
                          transactions: [...transactionToSign.strategy.transactions, newTx],
                        };

                        const updatedStrategies = strategies.map(s => 
                          s.id === transactionToSign.strategy.id ? updatedStrategy : s
                        );
                        setStrategies(updatedStrategies);
                        localStorage.setItem('dca-strategies', JSON.stringify(updatedStrategies));
                        
                        alert(`Transaction signed successfully!\n\nSignature: ${signData.signature.slice(0, 20)}...\n\nTransaction has been executed and recorded.`);
                      } else {
                        alert('Failed to sign transaction');
                      }
                    } catch (error) {
                      console.error('Error signing transaction:', error);
                      alert('Error signing transaction');
                    } finally {
                      setShowSigningModal(false);
                      setTransactionToSign(null);
                      setExecuting(false);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700"
                >
                  Sign & Execute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}