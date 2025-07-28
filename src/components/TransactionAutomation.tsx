"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import PolicyDemo from "./PolicyDemo";
import AutomatedDCADemo from "./AutomatedDCADemo";

interface AutomationPolicy {
  id: string;
  name: string;
  type: 'spending_limit' | 'gas_limit' | 'address_allowlist' | 'time_based' | 'dca' | 'custom';
  status: 'active' | 'paused' | 'completed';
  chain?: 'ethereum' | 'polygon' | 'arbitrum' | 'base' | 'optimism' | 'all';
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  config?: {
    dailyLimit?: string;
    maxGasPrice?: string;
    allowedAddresses?: string[];
    startHour?: number;
    endHour?: number;
    asset?: string;
    amount?: string;
    frequency?: 'daily' | 'weekly' | 'monthly';
  };
}

export default function TransactionAutomation() {
  const { activeWallet } = useWallet();
  const [policies, setPolicies] = useState<AutomationPolicy[]>([]);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [selectedPolicyType, setSelectedPolicyType] = useState<'spending_limit' | 'gas_limit' | 'address_allowlist' | 'time_based'>('spending_limit');
  const [activeView, setActiveView] = useState<'policies' | 'dca-demo'>('policies');
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'polygon' | 'arbitrum' | 'base' | 'optimism' | 'all'>('all');
  
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    type: 'spending_limit' as const,
    dailyLimit: '1',
    maxGasPrice: '100',
    allowedAddresses: '',
    startHour: '9',
    endHour: '17',
  });

  // Chain configurations
  const chainConfigs = {
    ethereum: { name: 'Ethereum', icon: '⟠', color: 'bg-blue-500' },
    polygon: { name: 'Polygon', icon: '⬡', color: 'bg-purple-500' },
    arbitrum: { name: 'Arbitrum', icon: '🔷', color: 'bg-blue-600' },
    base: { name: 'Base', icon: '🔵', color: 'bg-blue-700' },
    optimism: { name: 'Optimism', icon: '🔴', color: 'bg-red-500' },
    all: { name: 'All Chains', icon: '🌐', color: 'bg-gray-500' },
  };

  // Load existing policies
  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const response = await fetch('/api/list-policies', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setPolicies(data.policies);
      }
    } catch (error) {
      console.error('Error loading policies:', error);
    } finally {
      setPoliciesLoading(false);
    }
  };

  const createPolicy = async () => {
    if (!activeWallet) {
      alert('Please select a wallet first');
      return;
    }

    if (!newPolicy.name) {
      alert('Please enter a policy name');
      return;
    }

    setLoading(true);
    try {
      // Prepare conditions based on policy type
      let conditions: any = {};
      
      if (selectedPolicyType === 'spending_limit') {
        conditions = {
          dailyLimit: `${parseFloat(newPolicy.dailyLimit) * 1e18}`, // Convert ETH to Wei
          walletAddress: activeWallet.accounts?.[0]?.address || '',
        };
      } else if (selectedPolicyType === 'gas_limit') {
        conditions = {
          maxGasPrice: `${parseFloat(newPolicy.maxGasPrice) * 1e9}`, // Convert Gwei to Wei
        };
      } else if (selectedPolicyType === 'address_allowlist') {
        conditions = {
          allowedAddresses: newPolicy.allowedAddresses
            .split(',')
            .map(addr => addr.trim().toLowerCase())
            .filter(addr => addr.length > 0),
        };
      } else if (selectedPolicyType === 'time_based') {
        conditions = {
          startHour: parseInt(newPolicy.startHour),
          endHour: parseInt(newPolicy.endHour),
        };
      }

      const response = await fetch('/api/create-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyName: newPolicy.name,
          policyType: selectedPolicyType,
          conditions: conditions,
          chain: selectedChain,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Add the new policy to the list
        const createdPolicy: AutomationPolicy = {
          id: data.policy.id,
          name: data.policy.name,
          type: selectedPolicyType,
          status: 'active',
          chain: selectedChain,
          createdAt: data.policy.createdAt,
          config: conditions,
        };
        
        setPolicies([...policies, createdPolicy]);
        setShowCreatePolicy(false);
        resetForm();
        
        alert(`Policy "${data.policy.name}" created successfully!`);
        
        // Reload policies to get the latest from server
        loadPolicies();
      } else {
        alert(`Failed to create policy: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      alert('Failed to create policy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewPolicy({
      name: '',
      type: 'spending_limit',
      dailyLimit: '1',
      maxGasPrice: '100',
      allowedAddresses: '',
      startHour: '9',
      endHour: '17',
    });
    setSelectedPolicyType('spending_limit');
  };

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'spending_limit': return '💰';
      case 'gas_limit': return '⛽';
      case 'address_allowlist': return '📋';
      case 'time_based': return '⏰';
      case 'dca': return '📈';
      default: return '🔧';
    }
  };

  const getPolicyDescription = (policy: AutomationPolicy) => {
    switch (policy.type) {
      case 'spending_limit':
        return `Daily limit: ${policy.config?.dailyLimit ? parseFloat(policy.config.dailyLimit) / 1e18 : 0} ETH`;
      case 'gas_limit':
        return `Max gas: ${policy.config?.maxGasPrice ? parseFloat(policy.config.maxGasPrice) / 1e9 : 0} Gwei`;
      case 'address_allowlist':
        return `${policy.config?.allowedAddresses?.length || 0} allowed addresses`;
      case 'time_based':
        return `Active ${policy.config?.startHour || 9}:00 - ${policy.config?.endHour || 17}:00 UTC`;
      default:
        return policy.notes || 'Custom policy';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveView('policies')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'policies'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Policy Management
          </button>
          <button
            onClick={() => setActiveView('dca-demo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'dca-demo'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            DCA Automation Demo
          </button>
        </nav>
      </div>

      {/* Policy Management View */}
      {activeView === 'policies' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Multi-Chain Transaction Automation Policies</h3>
              <p className="text-sm text-gray-600 mt-1">
                Powered by Turnkey&apos;s Policy Engine - Set cross-chain rules to automate and control transactions
              </p>
            </div>
            <button
              onClick={() => setShowCreatePolicy(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              + Create Policy
            </button>
          </div>

      {/* Policies List */}
      {policiesLoading ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-4">⏳</div>
          <p className="text-gray-500">Loading policies...</p>
        </div>
      ) : policies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">🤖</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Automation Policies</h4>
          <p className="text-gray-600 mb-4">Create your first policy to automate transaction controls</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-sm font-medium text-gray-900">Spending Limits</p>
              <p className="text-xs text-gray-600">Set daily transaction limits</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl mb-2">⛽</div>
              <p className="text-sm font-medium text-gray-900">Gas Control</p>
              <p className="text-xs text-gray-600">Limit maximum gas prices</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl mb-2">📋</div>
              <p className="text-sm font-medium text-gray-900">Address Lists</p>
              <p className="text-xs text-gray-600">Restrict to allowed addresses</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl mb-2">⏰</div>
              <p className="text-sm font-medium text-gray-900">Time Windows</p>
              <p className="text-xs text-gray-600">Set operating hours</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{getPolicyIcon(policy.type)}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{policy.name}</h4>
                    <p className="text-sm text-gray-600">{getPolicyDescription(policy)}</p>
                    {policy.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {new Date(policy.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {policy.chain && (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${chainConfigs[policy.chain].color} text-white flex items-center space-x-1`}>
                      <span>{chainConfigs[policy.chain].icon}</span>
                      <span>{chainConfigs[policy.chain].name}</span>
                    </span>
                  )}
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                    policy.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {policy.status}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 mt-0.5">ℹ️</div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900">How Turnkey Multi-Chain Policies Work</h4>
            <p className="text-sm text-blue-800 mt-1">
              Policies are evaluated server-side before any transaction is signed across all supported chains. 
              They provide cryptographically verifiable rules that control when and how transactions can be 
              executed on Ethereum, Polygon, Arbitrum, Base, and Optimism, ensuring security without sacrificing 
              automation capabilities.
            </p>
          </div>
        </div>
      </div>

          {/* Policy Demo Section */}
          <PolicyDemo />
        </>
      )}

      {/* DCA Demo View */}
      {activeView === 'dca-demo' && (
        <AutomatedDCADemo />
      )}

      {/* Create Policy Modal */}
      {showCreatePolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create Automation Policy</h3>
                <button
                  onClick={() => {
                    setShowCreatePolicy(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Chain Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                          <span className="text-xl">{chainConfigs[chain].icon}</span>
                          <span className="text-sm font-medium">{chainConfigs[chain].name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedChain === 'all' 
                      ? 'Policy will apply to transactions on all supported chains'
                      : `Policy will only apply to transactions on ${chainConfigs[selectedChain].name}`}
                  </p>
                </div>

                {/* Policy Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Policy Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: 'spending_limit' as const, icon: '💰', name: 'Spending Limit', desc: 'Set daily transaction limits' },
                      { type: 'gas_limit' as const, icon: '⛽', name: 'Gas Price Limit', desc: 'Control maximum gas prices' },
                      { type: 'address_allowlist' as const, icon: '📋', name: 'Address Allowlist', desc: 'Restrict to specific addresses' },
                      { type: 'time_based' as const, icon: '⏰', name: 'Time Restrictions', desc: 'Set operating hours' },
                    ].map((pType) => (
                      <button
                        key={pType.type}
                        onClick={() => setSelectedPolicyType(pType.type)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedPolicyType === pType.type
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{pType.icon}</div>
                        <p className="font-medium text-gray-900">{pType.name}</p>
                        <p className="text-xs text-gray-600">{pType.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Policy Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Name
                  </label>
                  <input
                    type="text"
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    placeholder="e.g., Daily spending limit for trading"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Dynamic Fields Based on Policy Type */}
                {selectedPolicyType === 'spending_limit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Spending Limit (ETH)
                    </label>
                    <input
                      type="number"
                      value={newPolicy.dailyLimit}
                      onChange={(e) => setNewPolicy({ ...newPolicy, dailyLimit: e.target.value })}
                      placeholder="1.0"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum ETH that can be spent per day from this wallet
                    </p>
                  </div>
                )}

                {selectedPolicyType === 'gas_limit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Gas Price (Gwei)
                    </label>
                    <input
                      type="number"
                      value={newPolicy.maxGasPrice}
                      onChange={(e) => setNewPolicy({ ...newPolicy, maxGasPrice: e.target.value })}
                      placeholder="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Transactions will only execute when gas price is below this limit
                    </p>
                  </div>
                )}

                {selectedPolicyType === 'address_allowlist' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Addresses (comma-separated)
                    </label>
                    <textarea
                      value={newPolicy.allowedAddresses}
                      onChange={(e) => setNewPolicy({ ...newPolicy, allowedAddresses: e.target.value })}
                      placeholder="0x123..., 0x456..., 0x789..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only allow transactions to these addresses
                    </p>
                  </div>
                )}

                {selectedPolicyType === 'time_based' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Hour (UTC)
                      </label>
                      <select
                        value={newPolicy.startHour}
                        onChange={(e) => setNewPolicy({ ...newPolicy, startHour: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{i}:00</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Hour (UTC)
                      </label>
                      <select
                        value={newPolicy.endHour}
                        onChange={(e) => setNewPolicy({ ...newPolicy, endHour: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{i}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Policy Summary */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">Policy Summary</h4>
                  <p className="text-sm text-purple-800">
                    {selectedPolicyType === 'spending_limit' && 
                      `This policy will limit daily spending to ${newPolicy.dailyLimit || '0'} ETH.`}
                    {selectedPolicyType === 'gas_limit' && 
                      `Transactions will only execute when gas price is below ${newPolicy.maxGasPrice || '0'} Gwei.`}
                    {selectedPolicyType === 'address_allowlist' && 
                      `Only transactions to ${newPolicy.allowedAddresses.split(',').filter(a => a.trim()).length} allowed addresses will be permitted.`}
                    {selectedPolicyType === 'time_based' && 
                      `Transactions will only be allowed between ${newPolicy.startHour}:00 and ${newPolicy.endHour}:00 UTC.`}
                  </p>
                  <p className="text-xs text-purple-700 mt-2">
                    <strong>Chain:</strong> {chainConfigs[selectedChain].icon} {chainConfigs[selectedChain].name}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreatePolicy(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPolicy}
                    disabled={loading || !newPolicy.name}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Creating...' : 'Create Policy'}
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