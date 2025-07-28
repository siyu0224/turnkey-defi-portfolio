"use client";

import { useState } from "react";

export default function TestPolicyStatus() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testPolicyCreation = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Test creating a simple policy
      const createResponse = await fetch('/api/create-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyName: `Test Policy - ${new Date().toISOString()}`,
          policyType: 'spending_limit',
          conditions: {
            dailyLimit: '1000000000000000000', // 1 ETH
          },
          chain: 'ethereum',
        }),
      });

      const createData = await createResponse.json();
      
      // List all policies
      const listResponse = await fetch('/api/list-all-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const listData = await listResponse.json();

      setResult({
        createResult: createData,
        listResult: listData,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      setResult({ 
        error: 'Network error', 
        details: error?.message || error,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const listPoliciesOnly = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/list-all-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setResult({
        listResult: data,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      setResult({ 
        error: 'Network error', 
        details: error?.message || error,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Policy Status</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Policy Operations</h2>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={testPolicyCreation}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mr-4"
              >
                {loading ? 'Testing...' : 'Create Test Policy & List All'}
              </button>
              
              <button
                onClick={listPoliciesOnly}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'List Policies Only'}
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result:</h2>
            
            {result.createResult && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Create Policy Result:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(result.createResult, null, 2)}
                </pre>
              </div>
            )}
            
            {result.listResult && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">All Policies ({result.listResult.totalCount || 0}):</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(result.listResult, null, 2)}
                </pre>
                
                {result.listResult.policies && result.listResult.policies.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Policy Summary:</h4>
                    <div className="space-y-2">
                      {result.listResult.policies.map((policy: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded">
                          <p className="font-medium">{policy.name}</p>
                          <p className="text-sm text-gray-600">ID: {policy.id}</p>
                          <p className="text-sm text-gray-600">Effect: {policy.effect}</p>
                          <p className="text-sm text-gray-600">Created: {new Date(policy.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              Timestamp: {result.timestamp}
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">What this tests:</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Creates a test spending limit policy</li>
            <li>Lists all policies in your Turnkey organization</li>
            <li>Shows the complete response from Turnkey API</li>
            <li>Helps verify if policies are being created correctly</li>
          </ul>
          
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Check Turnkey Dashboard:</h4>
            <p className="text-sm">
              After creating policies here, check your Turnkey dashboard at:
              <a href="https://app.turnkey.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                https://app.turnkey.com
              </a>
            </p>
            <p className="text-sm mt-1">
              Navigate to: Organization → Policies (if available in your plan)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}