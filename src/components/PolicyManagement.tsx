"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";

interface Policy {
  id: string;
  name: string;
  effect: string;
  condition: string;
  notes?: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export default function PolicyManagement() {
  const { activeWallet } = useWallet();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Chain configurations
  const chainConfigs = {
    ethereum: { name: 'Ethereum', icon: '⟠', color: 'bg-blue-500' },
    polygon: { name: 'Polygon', icon: '⬡', color: 'bg-purple-500' },
    arbitrum: { name: 'Arbitrum', icon: '🔷', color: 'bg-blue-600' },
    base: { name: 'Base', icon: '🔵', color: 'bg-blue-700' },
    optimism: { name: 'Optimism', icon: '🔴', color: 'bg-red-500' },
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/list-all-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success && data.policies) {
        setPolicies(data.policies);
      }
    } catch (error) {
      console.error('Error loading policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPolicyIcon = (condition: string) => {
    if (condition.includes('value >')) return '💰';
    if (condition.includes('gasPrice >')) return '⛽';
    if (condition.includes('parameters.to ==')) return '📋';
    if (condition.includes('true')) return '✅';
    if (condition.includes('false')) return '❌';
    return '🔧';
  };

  const getPolicyType = (condition: string, notes?: string) => {
    if (condition.includes('value >')) return 'Spending Limit';
    if (condition.includes('gasPrice >')) return 'Gas Limit';
    if (condition.includes('parameters.to ==')) return 'Address Allowlist';
    if (notes?.includes('DCA')) return 'DCA Strategy';
    if (notes?.includes('time')) return 'Time-based';
    if (condition === 'true') return 'Allow All';
    return 'Custom';
  };

  const getChainFromCondition = (condition: string) => {
    const chains = Object.keys(chainConfigs);
    for (const chain of chains) {
      const blockchain = `BLOCKCHAIN_${chain.toUpperCase()}`;
      if (condition.includes(blockchain)) {
        return chain as keyof typeof chainConfigs;
      }
    }
    return null;
  };

  const formatCondition = (condition: string) => {
    // Make the condition more readable
    return condition
      .replace(/activity\.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2"/g, 'Transaction')
      .replace(/activity\.parameters\./g, '')
      .replace(/BLOCKCHAIN_/g, '')
      .replace(/&&/g, ' AND ')
      .replace(/\|\|/g, ' OR ')
      .replace(/==/g, '=')
      .replace(/!/g, 'NOT ')
      .trim();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Policy Management</h2>
          <p className="text-gray-600 mt-1">
            View and manage all Turnkey policies across your wallets
          </p>
        </div>
        <button
          onClick={loadPolicies}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Loading policies...</p>
        </div>
      ) : policies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📜</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Policies Found</h3>
          <p className="text-gray-600">Create policies from the wallet creation or automation pages</p>
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => {
            const chain = getChainFromCondition(policy.condition);
            const policyType = getPolicyType(policy.condition, policy.notes);
            
            return (
              <div
                key={policy.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedPolicy(policy);
                  setShowDetails(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getPolicyIcon(policy.condition)}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{policy.name}</h4>
                      <p className="text-sm text-gray-600">{policyType}</p>
                      {policy.notes && (
                        <p className="text-xs text-gray-500 mt-1">{policy.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {chain && (
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${chainConfigs[chain].color} text-white flex items-center space-x-1`}>
                        <span>{chainConfigs[chain].icon}</span>
                        <span>{chainConfigs[chain].name}</span>
                      </span>
                    )}
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      policy.effect === 'EFFECT_ALLOW' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {policy.effect === 'EFFECT_ALLOW' ? 'Allow' : 'Deny'}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      policy.status === 'active'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {policy.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Policy Details Modal */}
      {showDetails && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Policy Details</h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedPolicy(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy Name</label>
                  <p className="mt-1 text-gray-900">{selectedPolicy.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy ID</label>
                  <p className="mt-1 text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded">
                    {selectedPolicy.id}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Effect</label>
                  <p className="mt-1">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      selectedPolicy.effect === 'EFFECT_ALLOW' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedPolicy.effect === 'EFFECT_ALLOW' ? 'Allow' : 'Deny'}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Condition</label>
                  <div className="mt-1 bg-gray-100 p-3 rounded-lg">
                    <p className="text-sm text-gray-800 font-mono break-all">
                      {selectedPolicy.condition}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    <strong>Readable:</strong> {formatCondition(selectedPolicy.condition)}
                  </p>
                </div>

                {selectedPolicy.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-gray-900">{selectedPolicy.notes}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedPolicy.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">How This Policy Works</h4>
                    <p className="text-sm text-blue-800">
                      {selectedPolicy.effect === 'EFFECT_ALLOW' 
                        ? 'This policy allows transactions when the condition is met.' 
                        : 'This policy denies transactions when the condition is met.'}
                      {' '}
                      Policies are evaluated server-side by Turnkey before any transaction is signed, 
                      providing cryptographically verifiable transaction controls.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}