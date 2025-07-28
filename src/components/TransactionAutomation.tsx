"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";

interface AutomationPolicy {
  id: string;
  name: string;
  type: 'dca' | 'limit_order' | 'auto_stake';
  status: 'active' | 'paused' | 'completed';
  config: {
    asset: string;
    amount: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    maxGasPrice?: string;
    targetPrice?: string;
    totalBudget?: string;
    executedAmount?: string;
  };
  createdAt: string;
  nextExecution?: string;
}

export default function TransactionAutomation() {
  const { activeWallet } = useWallet();
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [policies, setPolicies] = useState<AutomationPolicy[]>([
    // Example policies for demo
    {
      id: '1',
      name: 'Weekly ETH DCA',
      type: 'dca',
      status: 'active',
      config: {
        asset: 'ETH',
        amount: '100',
        frequency: 'weekly',
        maxGasPrice: '50',
        totalBudget: '5000',
        executedAmount: '400'
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextExecution: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ]);

  const [newPolicy, setNewPolicy] = useState({
    name: '',
    type: 'dca' as const,
    asset: 'ETH',
    amount: '',
    frequency: 'weekly' as const,
    totalBudget: '',
    maxGasPrice: '50'
  });

  const createPolicy = async () => {
    if (!activeWallet) {
      alert('Please select a wallet first');
      return;
    }

    try {
      const response = await fetch('/api/create-automation-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: activeWallet.id,
          policy: newPolicy
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const policy: AutomationPolicy = {
          id: Date.now().toString(),
          name: newPolicy.name,
          type: newPolicy.type,
          status: 'active',
          config: {
            asset: newPolicy.asset,
            amount: newPolicy.amount,
            frequency: newPolicy.frequency,
            maxGasPrice: newPolicy.maxGasPrice,
            totalBudget: newPolicy.totalBudget,
            executedAmount: '0'
          },
          createdAt: new Date().toISOString(),
          nextExecution: new Date(Date.now() + 
            ((newPolicy.frequency as string) === 'daily' ? 24 : 
             (newPolicy.frequency as string) === 'weekly' ? 168 : 720) * 60 * 60 * 1000
          ).toISOString()
        };
        
        setPolicies([...policies, policy]);
        setShowCreatePolicy(false);
        setNewPolicy({
          name: '',
          type: 'dca',
          asset: 'ETH',
          amount: '',
          frequency: 'weekly',
          totalBudget: '',
          maxGasPrice: '50'
        });
        
        alert('Automation policy created successfully!');
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      alert('Failed to create automation policy');
    }
  };

  const togglePolicy = (policyId: string) => {
    setPolicies(policies.map(p => 
      p.id === policyId 
        ? { ...p, status: p.status === 'active' ? 'paused' : 'active' }
        : p
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction Automation</h2>
          <p className="text-gray-600 mt-1">Set up automated trading strategies powered by Turnkey</p>
        </div>
        <button
          onClick={() => setShowCreatePolicy(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          + Create Automation
        </button>
      </div>

      {/* Active Policies */}
      <div className="space-y-4">
        {policies.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Automation Policies</h3>
            <p className="text-gray-600">Create your first automated trading strategy</p>
          </div>
        ) : (
          policies.map(policy => (
            <div key={policy.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      policy.status === 'active' ? 'bg-green-100 text-green-700' :
                      policy.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {policy.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Strategy</p>
                      <p className="font-medium text-gray-900">
                        {policy.type === 'dca' ? 'Dollar Cost Average' : 
                         policy.type === 'limit_order' ? 'Limit Order' : 'Auto Stake'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="font-medium text-gray-900">
                        ${policy.config.amount} {policy.config.asset} / {policy.config.frequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Progress</p>
                      <p className="font-medium text-gray-900">
                        ${policy.config.executedAmount} / ${policy.config.totalBudget}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Next Run</p>
                      <p className="font-medium text-gray-900">
                        {policy.nextExecution ? new Date(policy.nextExecution).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                        style={{ 
                          width: `${(parseFloat(policy.config.executedAmount || '0') / parseFloat(policy.config.totalBudget || '1')) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => togglePolicy(policy.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      policy.status === 'active' 
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {policy.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Policy Modal */}
      {showCreatePolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create Automation Policy</h3>
                <button
                  onClick={() => setShowCreatePolicy(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Name
                  </label>
                  <input
                    type="text"
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    placeholder="e.g., Weekly ETH Purchase"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategy Type
                  </label>
                  <select
                    value={newPolicy.type}
                    onChange={(e) => setNewPolicy({ ...newPolicy, type: e.target.value as 'dca' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="dca">Dollar Cost Average (DCA)</option>
                    <option value="limit_order" disabled>Limit Order (Coming Soon)</option>
                    <option value="auto_stake" disabled>Auto Staking (Coming Soon)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asset
                    </label>
                    <select
                      value={newPolicy.asset}
                      onChange={(e) => setNewPolicy({ ...newPolicy, asset: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="ETH">ETH</option>
                      <option value="BTC">BTC</option>
                      <option value="USDC">USDC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount per Purchase
                    </label>
                    <input
                      type="number"
                      value={newPolicy.amount}
                      onChange={(e) => setNewPolicy({ ...newPolicy, amount: e.target.value })}
                      placeholder="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={newPolicy.frequency}
                    onChange={(e) => setNewPolicy({ ...newPolicy, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Budget
                  </label>
                  <input
                    type="number"
                    value={newPolicy.totalBudget}
                    onChange={(e) => setNewPolicy({ ...newPolicy, totalBudget: e.target.value })}
                    placeholder="5000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Gas Price (Gwei)
                  </label>
                  <input
                    type="number"
                    value={newPolicy.maxGasPrice}
                    onChange={(e) => setNewPolicy({ ...newPolicy, maxGasPrice: e.target.value })}
                    placeholder="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Policy Summary:</strong> Buy ${newPolicy.amount || '0'} worth of {newPolicy.asset} {newPolicy.frequency} 
                    {newPolicy.totalBudget && ` until ${newPolicy.totalBudget} total is spent`}
                    {newPolicy.maxGasPrice && `, only when gas is below ${newPolicy.maxGasPrice} Gwei`}.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreatePolicy(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPolicy}
                    disabled={!newPolicy.name || !newPolicy.amount || !newPolicy.totalBudget}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                  >
                    Create Policy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}