"use client";

import { useState } from "react";

export default function TestPolicyPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<string>("allow_all");

  const testPolicyCreation = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-policy-creation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Network error', details: error });
    } finally {
      setLoading(false);
    }
  };

  const testRealPolicyCreation = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/create-policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policyName: "Test Spending Limit",
          policyType: "spending_limit",
          conditions: {
            dailyLimit: "1000000000000000000", // 1 ETH
            walletAddress: "0x0000000000000000000000000000000000000000"
          },
          chain: "ethereum"
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Network error', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Turnkey Policy Creation</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Simple Policy</h2>
          <p className="text-gray-600 mb-4">
            This will try to create the simplest possible policy to see if the feature is available.
          </p>
          <button
            onClick={testPolicyCreation}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Simple Policy Creation'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Different Policy Types</h2>
          <p className="text-gray-600 mb-4">
            Try different policy condition syntaxes to understand Turnkey&apos;s expression language.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Test Type:
            </label>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="allow_all">Allow All (simple true)</option>
              <option value="deny_all">Deny All (simple false)</option>
              <option value="activity_type">Activity Type Check</option>
              <option value="spending_limit">Spending Limit</option>
            </select>
          </div>
          
          <button
            onClick={async () => {
              setLoading(true);
              setResult(null);
              try {
                const response = await fetch('/api/test-policy-v2', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ testType: selectedTest }),
                });
                const data = await response.json();
                setResult(data);
              } catch (error) {
                setResult({ error: 'Network error', details: error });
              }
              setLoading(false);
            }}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Policy Creation'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                <p className="text-red-700">{result.message || result.error}</p>
                {result.suggestion && (
                  <p className="text-red-600 mt-2 text-sm">{result.suggestion}</p>
                )}
              </div>
            )}
            
            {result.success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-800">Success!</h3>
                <p className="text-green-700">Policy was created successfully!</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">What we&apos;re testing:</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Whether policy creation is available for your organization</li>
            <li>What the actual error message from Turnkey is</li>
            <li>Whether it&apos;s a permissions issue with your API key</li>
            <li>Whether the feature needs to be enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}