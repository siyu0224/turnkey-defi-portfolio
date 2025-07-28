"use client";

import { useState } from 'react';
import { TurnkeyClient } from '@turnkey/http';
import { WebauthnStamper } from '@turnkey/webauthn-stamper';

// Helper function to convert ArrayBuffer to base64URL
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

interface TurnkeyPasskeyAuthProps {
  onSuccess: (result: Record<string, unknown>) => void;
  onError: (error: string) => void;
  mode: 'signin' | 'signup';
}

export default function TurnkeyPasskeyAuth({ onSuccess, onError, mode }: TurnkeyPasskeyAuthProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePasskeyRegistration = async () => {
    setIsLoading(true);
    
    try {
      // Step 1: Generate WebAuthn credential
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(64));
      
      console.log('Creating WebAuthn credential...');
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            id: window.location.hostname,
            name: "Turnkey Wallet",
          },
          user: {
            id: userId,
            name: `user_${Date.now()}`,
            displayName: "Turnkey User",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
        },
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create passkey');
      }

      console.log('WebAuthn credential created:', credential.id);

      // Step 2: Create Turnkey sub-organization with the passkey
      const response = await fetch('/api/turnkey-passkey-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `user_${Date.now()}@passkey.local`,
          credentialCreationOptions: {
            challenge: arrayBufferToBase64Url(challenge.buffer),
          },
          attestationResponse: {
            id: credential.id,
            response: {
              clientDataJSON: arrayBufferToBase64Url((credential.response as AuthenticatorAttestationResponse).clientDataJSON),
              attestationObject: arrayBufferToBase64Url((credential.response as AuthenticatorAttestationResponse).attestationObject),
              transports: (credential.response as AuthenticatorAttestationResponse).getTransports?.() || ['internal'],
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register passkey with Turnkey');
      }

      const result = await response.json();
      console.log('Turnkey passkey registration successful:', result);
      
      onSuccess(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Passkey registration failed';
      console.error('Passkey registration error:', err);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyAuthentication = async () => {
    setIsLoading(true);
    
    try {
      // Create WebAuthn stamper for authentication
      const stamper = new WebauthnStamper({
        rpId: window.location.hostname,
      });

      // Create Turnkey client with WebAuthn stamper
      const turnkeyClient = new TurnkeyClient({
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
      }, stamper);

      // Try to authenticate by making a request with the WebAuthn stamper
      // This will trigger the WebAuthn prompt and handle signing
      console.log('Attempting authentication with Turnkey WebAuthn stamper');
      
      // Make a test request that requires authentication
      const whoamiResponse = await turnkeyClient.getWhoami({
        organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
      });

      console.log('Turnkey authentication successful:', whoamiResponse);
      onSuccess(whoamiResponse);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      console.error('Passkey authentication error:', err);
      
      // If credential not found, suggest registration
      if (errorMessage.includes('credential') || errorMessage.includes('not found') || errorMessage.includes('SIGNATURE_INVALID')) {
        onError('No passkey found. Please sign up first.');
      } else {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (mode === 'signup') {
      handlePasskeyRegistration();
    } else {
      handlePasskeyAuthentication();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-3"
    >
      <div className="w-6 h-6">
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
          </svg>
        )}
      </div>
      <span className="font-semibold">
        {isLoading 
          ? (mode === 'signup' ? 'Creating Account...' : 'Signing In...') 
          : (mode === 'signup' ? 'Sign Up with Passkey' : 'Sign In with Passkey')
        }
      </span>
    </button>
  );
}