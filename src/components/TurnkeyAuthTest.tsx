"use client";

import { Auth } from '@turnkey/sdk-react';

export default function TurnkeyAuthTest() {
  const authConfig = {
    emailEnabled: true,
    passkeyEnabled: true,
    phoneEnabled: true,
    walletEnabled: false,
    appleEnabled: false,
    facebookEnabled: false,
    googleEnabled: false,
  };

  const handleAuthSuccess = async () => {
    console.log('Auth Success');
    alert('Authentication successful!');
  };

  const handleAuthError = (error: string) => {
    console.error('Auth Error:', error);
    alert(`Authentication failed: ${error}`);
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Turnkey Auth Test</h2>
      
      {/* Environment Debug */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Environment Check:</h3>
        <div className="text-sm space-y-1">
          <div>Org ID: {process.env.NEXT_PUBLIC_ORGANIZATION_ID ? 'Set ✓' : 'Missing ✗'}</div>
          <div>Base URL: {process.env.NEXT_PUBLIC_BASE_URL || 'Not set'}</div>
        </div>
      </div>

      {/* Simple Auth Component */}
      <div className="border p-4">
        <Auth
          authConfig={authConfig}
          configOrder={['passkey', 'email', 'phone']}
          onAuthSuccess={handleAuthSuccess}
          onError={handleAuthError}
        />
      </div>
    </div>
  );
}