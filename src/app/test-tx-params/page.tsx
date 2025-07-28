"use client";

import { useState } from "react";

export default function TestTransactionParams() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testTransactionParams = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-transaction-params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const testEthTxParams = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-eth-tx-params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const testCustomCondition = async () => {
    const condition = prompt("Enter a custom condition to test:", 
      "activity.resource == 'TRANSACTION' && activity.parameters.value > 1000000000000000000");
    
    if (!condition) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-policy-syntax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // For now, we'll use the existing test endpoint
      // In production, you'd create a custom test endpoint
      const data = await response.json();
      setResult({
        custom: true,
        condition,
        note: "Used existing test endpoint. Create a custom endpoint for specific condition testing.",
        data
      });
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
        <h1 className="text-3xl font-bold mb-8">Test Transaction Parameter Access</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Transaction Parameter Syntax</h2>
          <p className="text-gray-600 mb-4">
            This will test various ways to access transaction parameters in Turnkey policies.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={testTransactionParams}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Activity Parameter Syntaxes'}
            </button>

            <button
              onClick={testEthTxParams}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 ml-4"
            >
              {loading ? 'Testing...' : 'Test ETH.TX Parameter Syntaxes'}
            </button>

            <button
              onClick={testCustomCondition}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50 ml-4"
            >
              {loading ? 'Testing...' : 'Test Custom Condition'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Results:</h2>
            
            {result.results && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Summary:</h3>
                  <div className="bg-gray-100 p-3 rounded">
                    <p>Total tests: {result.summary.total}</p>
                    <p className="text-green-600">✓ Successful: {result.summary.successful}</p>
                    <p className="text-red-600">✗ Failed: {result.summary.failed}</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2">Detailed Results:</h3>
                {result.results.map((test: any, index: number) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded border ${
                      test.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{test.test}</p>
                        {test.success ? (
                          <p className="text-sm text-green-700 mt-1">
                            ✓ Success - Policy ID: {test.policyId}
                          </p>
                        ) : (
                          <p className="text-sm text-red-700 mt-1">
                            ✗ Failed: {test.error}
                          </p>
                        )}
                      </div>
                      <span className="text-2xl">
                        {test.success ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                ))}
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
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">What we&apos;re testing:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Activity fields (failed):</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                <li><code>activity.value</code></li>
                <li><code>activity.parameters.value</code></li>
                <li><code>activity.data.value</code></li>
                <li><code>activity.transaction.value</code></li>
                <li><code>activity.amount</code></li>
                <li><code>activity.metadata.value</code></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1 text-green-700">ETH.TX fields (from docs):</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><code>eth.tx.value</code> - Amount in wei</li>
                <li><code>eth.tx.gas_price</code> - Gas price</li>
                <li><code>eth.tx.to</code> - Recipient address</li>
                <li><code>eth.tx.from</code> - Sender address</li>
                <li><code>eth.tx.data</code> - Calldata</li>
                <li><code>eth.tx.gas</code> - Gas limit</li>
              </ul>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-gray-600">
            According to Turnkey docs, the <code>eth.tx.*</code> syntax should work for transaction parameters!
          </p>
        </div>
      </div>
    </div>
  );
}