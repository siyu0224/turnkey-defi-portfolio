"use client";

import { Auth } from '@turnkey/sdk-react';
import { useState } from 'react';

export default function TurnkeyProperAuth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Auth configuration that enables both sign in and sign up
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
    console.log('Authentication successful!');
    alert('Success! Check console for details.');
  };

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error);
    
    // If credential not found, suggest switching to sign up mode
    if (error.includes('credential ID could not be found') && mode === 'signin') {
      alert('No account found. Please sign up first.');
      setMode('signup');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Turnkey Authentication</h2>
      
      {/* Mode Switcher */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setMode('signin')}
          className={`flex-1 py-2 px-4 rounded ${
            mode === 'signin' 
              ? 'bg-white text-blue-600 font-semibold shadow' 
              : 'text-gray-600'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 py-2 px-4 rounded ${
            mode === 'signup' 
              ? 'bg-white text-blue-600 font-semibold shadow' 
              : 'text-gray-600'
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Mode:</strong> {mode === 'signin' ? 'Sign In' : 'Sign Up (Create New Account)'}
        </p>
      </div>

      {/* Turnkey Auth Component */}
      <div key={mode}> {/* Key forces re-render when mode changes */}
        <Auth
          authConfig={authConfig}
          configOrder={['passkey', 'email', 'phone']}
          onAuthSuccess={handleAuthSuccess}
          onError={handleAuthError}
        />
      </div>

      <div className="mt-6 space-y-2 text-sm text-gray-600">
        <p>• <strong>Sign Up:</strong> Creates a new Turnkey sub-organization</p>
        <p>• <strong>Sign In:</strong> Authenticates with existing credentials</p>
        <p>• The Auth component should handle both flows automatically</p>
      </div>
    </div>
  );
}