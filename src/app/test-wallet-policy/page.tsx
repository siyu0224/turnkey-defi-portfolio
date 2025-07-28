"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";

export default function TestWalletPolicy() {
  const { wallets, activeWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [selectedWalletName, setSelectedWalletName] = useState("");

  useEffect(() => {
    if (activeWallet) {
      setSelectedWalletId(activeWallet.id);
      setSelectedWalletName(activeWallet.name);
    }
  }, [activeWallet]);

  const testWalletPolicy = async () => {
    if (!selectedWalletId) {
      alert("Please select a wallet first");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-wallet-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: selectedWalletId,
          walletName: selectedWalletName,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ 
        error: 'Network error', 
        details: error?.message || error,
      });
    } finally {
      setLoading(false);
    }
  };

  const createAndTestNewWallet = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Create a new multi-chain wallet
      const walletResponse = await fetch('/api/create-multi-chain-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletName: `Policy Test Wallet ${Date.now()}`,
          chains: ['ethereum', 'polygon'],
        }),
      });

      const walletData = await walletResponse.json();
      
      if (walletData.success) {
        // Now test policy creation for this wallet
        const policyResponse = await fetch('/api/test-wallet-policy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletId: walletData.wallet.id,
            walletName: walletData.wallet.name,
          }),
        });

        const policyData = await policyResponse.json();
        
        setResult({
          walletCreation: walletData,
          policyTest: policyData,
          timestamp: new Date().toISOString(),
        });
      } else {
        setResult({
          error: "Failed to create wallet",
          details: walletData,
        });
      }
    } catch (error: any) {
      setResult({ 
        error: 'Network error', 
        details: error?.message || error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Wallet Policy Creation</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Policy Creation Approaches</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Wallet
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => {
                  setSelectedWalletId(e.target.value);
                  const wallet = wallets.find(w => w.id === e.target.value);
                  setSelectedWalletName(wallet?.name || '');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-- Select a wallet --</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} ({wallet.id.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={testWalletPolicy}
                disabled={loading || !selectedWalletId}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Policy Creation'}
              </button>

              <button
                onClick={createAndTestNewWallet}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create New Wallet & Test'}
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result:</h2>
            
            {result.walletCreation && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Wallet Creation:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(result.walletCreation, null, 2)}
                </pre>
              </div>
            )}
            
            {result.policyTest && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Policy Test Results:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(result.policyTest, null, 2)}
                </pre>
              </div>
            )}
            
            {result.testResults && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Test Results Summary:</h3>
                <div className="space-y-2">
                  {result.testResults.map((test: any, index: number) => (
                    <div key={index} className={`p-3 rounded ${test.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <p className="font-medium">{test.approach}</p>
                      {test.success ? (
                        <p className="text-sm text-green-700">✓ Success - Policy ID: {test.policyId}</p>
                      ) : (
                        <p className="text-sm text-red-700">✗ Failed: {test.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {result.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
                <p className="text-red-700">{result.error}</p>
                {result.details && (
                  <pre className="mt-2 text-sm text-red-600">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-4">
              Timestamp: {result.timestamp || new Date().toISOString()}
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">What this tests:</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Different approaches to create wallet-specific policies</li>
            <li>Whether policies need to be associated with wallets</li>
            <li>What conditions work for wallet-specific policies</li>
            <li>Whether the policies are actually being created</li>
          </ul>
          
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Policy Creation Approaches Tested:</h4>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Simple test policy (general policy without wallet reference)</li>
              <li>Wallet-specific condition (using walletId in condition)</li>
              <li>Organization-scoped condition</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}