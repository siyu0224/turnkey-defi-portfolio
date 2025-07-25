"use client";

import { useState } from 'react';

interface FallbackAuthProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function FallbackAuth({ onSuccess, onError }: FallbackAuthProps) {
  const [activeMethod, setActiveMethod] = useState<'passkey' | 'email' | 'phone' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'method' | 'otp'>('method');

  const handlePasskey = async () => {
    setActiveMethod('passkey');
    setIsLoading(true);
    
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('Passkeys not supported in this browser');
      }

      // Try to authenticate with existing passkey first
      try {
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            timeout: 60000,
            allowCredentials: [],
            userVerification: 'preferred'
          }
        });

        if (credential) {
          console.log('Passkey authentication successful');
          onSuccess();
          return;
        }
      } catch {
        console.log('No existing passkey, creating new one...');
      }

      // Create new passkey
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: "DeFi Portfolio",
            id: window.location.hostname,
          },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: "demo@example.com",
            displayName: "Demo User",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
            residentKey: "preferred"
          },
          timeout: 60000,
          attestation: "direct"
        }
      });

      if (credential) {
        console.log('Passkey created successfully');
        onSuccess();
      }
    } catch (error) {
      let errorMessage = 'Passkey authentication failed. ';
      if (error instanceof Error) {
        if (error.name === 'NotSupportedError') {
          errorMessage += 'Passkeys not supported on this device.';
        } else if (error.name === 'NotAllowedError') {
          errorMessage += 'Operation cancelled or not allowed.';
        } else {
          errorMessage += error.message;
        }
      }
      onError(errorMessage);
    } finally {
      setIsLoading(false);
      setActiveMethod(null);
    }
  };

  const handleEmailAuth = () => {
    setActiveMethod('email');
    setStep('otp');
    // Simulate sending OTP
    setTimeout(() => {
      alert(`Demo: OTP sent to ${email}. Use any 6-digit code to continue.`);
    }, 500);
  };

  const handlePhoneAuth = () => {
    setActiveMethod('phone');
    setStep('otp');
    // Simulate sending SMS
    setTimeout(() => {
      alert(`Demo: SMS sent to ${phone}. Use any 6-digit code to continue.`);
    }, 500);
  };

  const handleOtpSubmit = () => {
    if (otpCode.length === 6) {
      console.log('OTP authentication successful');
      onSuccess();
    } else {
      onError('Please enter a 6-digit code');
    }
  };

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Enter Verification Code
          </h3>
          <p className="text-sm text-gray-600">
            We sent a 6-digit code to {activeMethod === 'email' ? email : phone}
          </p>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={6}
          />
          
          <button
            onClick={handleOtpSubmit}
            disabled={otpCode.length !== 6}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Verify Code
          </button>
          
          <button
            onClick={() => setStep('method')}
            className="w-full text-gray-600 hover:text-gray-800 py-2"
          >
            ← Back to methods
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choose Authentication Method
        </h3>
        <p className="text-sm text-gray-600">
          Select how you&apos;d like to authenticate
        </p>
      </div>
      
      {/* Passkey */}
      <button
        onClick={handlePasskey}
        disabled={isLoading && activeMethod === 'passkey'}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
      >
        <div className="flex items-center justify-center space-x-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
          </svg>
          <span className="font-semibold">
            {isLoading && activeMethod === 'passkey' ? 'Authenticating...' : 'Use Passkey'}
          </span>
        </div>
      </button>

      {/* Email */}
      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleEmailAuth}
          disabled={!email || isLoading}
          className="w-full bg-white border-2 border-gray-200 text-gray-900 p-3 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 font-medium"
        >
          Continue with Email
        </button>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
          className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handlePhoneAuth}
          disabled={!phone || isLoading}
          className="w-full bg-white border-2 border-gray-200 text-gray-900 p-3 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 font-medium"
        >
          Continue with Phone
        </button>
      </div>

      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-xs text-yellow-800">
          <strong>Demo Mode:</strong> This is a demonstration. In production, these would create real Turnkey sub-organizations and handle actual authentication.
        </div>
      </div>
    </div>
  );
}