"use client";

import { useTurnkey } from '@turnkey/sdk-react';
import { useState } from 'react';

export default function TurnkeyAuthDirect() {
  const { turnkey, passkeyClient, authIframeClient } = useTurnkey();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting passkey login...');
      console.log('Turnkey client:', turnkey);
      console.log('Passkey client:', passkeyClient);
      
      if (!passkeyClient) {
        throw new Error('Passkey client not available');
      }
      
      const result = await passkeyClient.login();
      console.log('Passkey login result:', result);
      alert('Passkey login successful!');
      
    } catch (err) {
      console.error('Passkey login error:', err);
      setError(err instanceof Error ? err.message : 'Passkey login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Email auth not implemented yet');
      // This would need to be implemented based on Turnkey's email auth flow
      alert('Email auth not implemented in this test');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email auth failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Direct Turnkey SDK Test</h2>
      
      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">SDK Status:</h3>
        <div className="text-sm space-y-1">
          <div>Turnkey: {turnkey ? 'Available ✓' : 'Not available ✗'}</div>
          <div>Passkey Client: {passkeyClient ? 'Available ✓' : 'Not available ✗'}</div>
          <div>Auth Iframe Client: {authIframeClient ? 'Available ✓' : 'Not available ✗'}</div>
          <div>Org ID: {process.env.NEXT_PUBLIC_ORGANIZATION_ID ? 'Set ✓' : 'Missing ✗'}</div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Auth Options */}
      <div className="space-y-4">
        <button
          onClick={handlePasskeyLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing Passkey...' : 'Test Passkey Login'}
        </button>

        <button
          onClick={handleEmailAuth}
          disabled={isLoading}
          className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing Email...' : 'Test Email Auth'}
        </button>
      </div>
    </div>
  );
}