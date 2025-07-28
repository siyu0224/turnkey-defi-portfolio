"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";

interface PolicyTest {
  type: 'spending_limit' | 'gas_limit' | 'address_allowlist' | 'time_based';
  description: string;
  testParams: any;
  shouldPass: boolean;
}

export default function PolicyDemo() {
  const { activeWallet } = useWallet();
  const [testing, setTesting] = useState(false);
  const [selectedTest, setSelectedTest] = useState<PolicyTest | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    policyViolation?: boolean;
  } | null>(null);

  const policyTests: PolicyTest[] = [
    {
      type: 'spending_limit',
      description: 'Try to send 2 ETH (exceeds 1 ETH daily limit)',
      testParams: {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
        value: '2000000000000000000', // 2 ETH in Wei
        gasPrice: '20000000000', // 20 Gwei
      },
      shouldPass: false,
    },
    {
      type: 'spending_limit',
      description: 'Try to send 0.5 ETH (within 1 ETH daily limit)',
      testParams: {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
        value: '500000000000000000', // 0.5 ETH in Wei
        gasPrice: '20000000000', // 20 Gwei
      },
      shouldPass: true,
    },
    {
      type: 'gas_limit',
      description: 'Try transaction with 150 Gwei gas (exceeds 100 Gwei limit)',
      testParams: {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
        value: '100000000000000000', // 0.1 ETH
        gasPrice: '150000000000', // 150 Gwei
      },
      shouldPass: false,
    },
    {
      type: 'address_allowlist',
      description: 'Try to send to non-allowlisted address',
      testParams: {
        to: '0x999999cf1046e68e36E1aA2E0E07105eDDD12345', // Random address
        value: '100000000000000000', // 0.1 ETH
        gasPrice: '20000000000', // 20 Gwei
      },
      shouldPass: false,
    },
    {
      type: 'time_based',
      description: 'Try transaction outside business hours',
      testParams: {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
        value: '100000000000000000', // 0.1 ETH
        gasPrice: '20000000000', // 20 Gwei
      },
      shouldPass: new Date().getUTCHours() >= 9 && new Date().getUTCHours() < 17,
    },
  ];

  const runTest = async (test: PolicyTest) => {
    if (!activeWallet) {
      alert('Please select a wallet first');
      return;
    }

    setTesting(true);
    setSelectedTest(test);
    setTestResult(null);

    try {
      // Simulate the transaction execution with policy check
      const response = await fetch('/api/execute-with-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: activeWallet.id,
          transactionType: 'eth_transfer',
          transactionParams: {
            ...test.testParams,
            nonce: '0', // Would be fetched in real implementation
            gasLimit: '21000',
            chainId: '1',
          },
          policyId: `demo-${test.type}-policy`,
        }),
      });

      const data = await response.json();
      
      setTestResult({
        success: data.success,
        message: data.success 
          ? 'Transaction would be allowed by policy' 
          : data.error || 'Transaction blocked by policy',
        policyViolation: data.policyViolation,
      });
    } catch (error) {
      console.error('Error testing policy:', error);
      setTestResult({
        success: false,
        message: 'Error testing policy execution',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Policy Testing Sandbox</h3>
        <p className="text-gray-600 mt-1">
          Test how different policies would affect transaction execution
        </p>
      </div>

      {/* Test Cases */}
      <div className="space-y-4">
        {policyTests.map((test, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">
                    {test.type === 'spending_limit' ? '💰' :
                     test.type === 'gas_limit' ? '⛽' :
                     test.type === 'address_allowlist' ? '📋' : '⏰'}
                  </span>
                  <h4 className="font-semibold text-gray-900">{test.description}</h4>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Policy Type: {test.type.replace('_', ' ')}</span>
                  <span>•</span>
                  <span className={test.shouldPass ? 'text-green-600' : 'text-red-600'}>
                    Expected: {test.shouldPass ? 'Allow' : 'Block'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => runTest(test)}
                disabled={testing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {testing && selectedTest === test ? 'Testing...' : 'Run Test'}
              </button>
            </div>

            {/* Test Result */}
            {testResult && selectedTest === test && (
              <div className={`mt-4 p-3 rounded-lg ${
                testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className={`text-lg ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success ? '✅' : '❌'}
                  </span>
                  <p className={`text-sm font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
                {testResult.policyViolation && (
                  <p className="text-xs text-red-600 mt-1">
                    Policy violation detected - transaction blocked by Turnkey Policy Engine
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">How Policy Enforcement Works</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Transaction request is submitted to Turnkey</li>
          <li>Policy Engine evaluates all active policies</li>
          <li>If any policy blocks the transaction, it&apos;s rejected</li>
          <li>Only transactions passing all policies are signed</li>
          <li>Audit trail is maintained for compliance</li>
        </ol>
      </div>
    </div>
  );
}