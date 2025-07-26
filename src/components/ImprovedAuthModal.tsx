"use client";

import { useState, useEffect } from 'react';
import { useTurnkey } from '@turnkey/sdk-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';

interface ImprovedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
  initialMode?: 'signin' | 'signup';
}

type AuthMethod = 'passkey' | 'email' | 'phone' | 'google' | null;
type AuthStep = 'select-method' | 'enter-details' | 'verify-otp' | 'processing';

export default function ImprovedAuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess,
  onAuthError,
  initialMode = 'signin'
}: ImprovedAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('select-method');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const { refreshSession } = useAuth();
  const { turnkey, passkeyClient, authIframeClient } = useTurnkey();

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setAuthMethod(null);
      setAuthStep('select-method');
      setError('');
      setEmail('');
      setPhone('');
      setOtpCode('');
    }
  }, [isOpen]);

  const handlePasskeyAuth = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (mode === 'signup') {
        // For signup, show email input first
        setAuthStep('enter-details');
        setAuthMethod('passkey');
        return;
      }

      // For sign in, use WebAuthn directly
      if (!window.PublicKeyCredential) {
        throw new Error('Passkeys not supported on this device');
      }

      // Create a passkey authentication request
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "preferred",
          rpId: window.location.hostname,
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Passkey authentication cancelled');
      }

      const assertionResponse = credential.response as AuthenticatorAssertionResponse;
      
      // Send credential to backend for verification
      const authResponse = await fetch('/api/authenticate-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialId: credential.id,
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertionResponse.authenticatorData))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertionResponse.clientDataJSON))),
          signature: btoa(String.fromCharCode(...new Uint8Array(assertionResponse.signature))),
        }),
      });

      if (!authResponse.ok) {
        throw new Error('Passkey authentication failed');
      }

      const { success } = await authResponse.json();
      
      if (success) {
        await refreshSession();
        onAuthSuccess?.();
        onClose();
      } else {
        throw new Error('Authentication was not successful');
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Passkey authentication failed';
      
      if (errorMsg.includes('NotAllowedError')) {
        setError('Passkey authentication was cancelled or not allowed');
      } else if (mode === 'signin') {
        setError('No passkey found. Please sign up first.');
        setMode('signup');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual Turnkey email auth
      // For now, simulate OTP sending
      setAuthStep('verify-otp');
      console.log('OTP would be sent to:', email);
      
    } catch (err) {
      setError('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phone) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual Turnkey phone auth
      // For now, simulate SMS sending
      setAuthStep('verify-otp');
      console.log('SMS would be sent to:', phone);
      
    } catch (err) {
      setError('Failed to send SMS code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otpCode.length !== 6) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual OTP verification
      console.log('Verifying OTP:', otpCode);
      
      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await refreshSession();
      onAuthSuccess?.();
      onClose();
      
    } catch (err) {
      setError('Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    console.log('Google OAuth Success:', credentialResponse);
    
    try {
      // TODO: Create Turnkey sub-org with Google OAuth
      await refreshSession();
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError('Google authentication failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold">T</span>
            </div>
            <h2 className="text-2xl font-bold">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-blue-100 mt-1">
              {mode === 'signin' 
                ? 'Sign in to your secure wallet' 
                : 'Get started with Turnkey'}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b">
          <button
            onClick={() => {
              setMode('signin');
              setAuthStep('select-method');
              setError('');
            }}
            className={`flex-1 py-3 font-medium transition-all ${
              mode === 'signin' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setAuthStep('select-method');
              setError('');
            }}
            className={`flex-1 py-3 font-medium transition-all ${
              mode === 'signup' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Method Selection */}
          {authStep === 'select-method' && (
            <div className="space-y-3">
              {/* Passkey */}
              <button
                onClick={() => {
                  setAuthMethod('passkey');
                  handlePasskeyAuth();
                }}
                disabled={isLoading}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center space-x-4 group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Passkey</div>
                  <div className="text-sm text-gray-600">Face ID, Touch ID, or security key</div>
                </div>
                {isLoading && authMethod === 'passkey' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                )}
              </button>

              {/* Email */}
              <button
                onClick={() => {
                  setAuthMethod('email');
                  setAuthStep('enter-details');
                }}
                disabled={isLoading}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center space-x-4 group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Email</div>
                  <div className="text-sm text-gray-600">Receive a verification code</div>
                </div>
              </button>

              {/* Phone */}
              <button
                onClick={() => {
                  setAuthMethod('phone');
                  setAuthStep('enter-details');
                }}
                disabled={isLoading}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center space-x-4 group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Phone</div>
                  <div className="text-sm text-gray-600">Receive an SMS code</div>
                </div>
              </button>

              {/* Google OAuth */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'demo-client-id'}>
                <div className="w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google authentication failed')}
                    theme="outline"
                    size="large"
                    text={mode === 'signup' ? 'signup_with' : 'signin_with'}
                    width="100%"
                  />
                </div>
              </GoogleOAuthProvider>
            </div>
          )}

          {/* Enter Details */}
          {authStep === 'enter-details' && (
            <div className="space-y-4">
              <button
                onClick={() => setAuthStep('select-method')}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {(authMethod === 'email' || (authMethod === 'passkey' && mode === 'signup')) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  </div>
                  
                  {authMethod === 'passkey' && mode === 'signup' ? (
                    <button
                      onClick={async () => {
                        if (!email) return;
                        setIsLoading(true);
                        setError('');
                        
                        try {
                          // Create sub-org first
                          const response = await fetch('/api/create-sub-org', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email }),
                          });

                          if (!response.ok) {
                            throw new Error('Failed to create account');
                          }

                          const { subOrganizationId } = await response.json();
                          
                          // Create passkey with proper Turnkey integration
                          const challenge = new Uint8Array(32);
                          crypto.getRandomValues(challenge);
                          
                          const credential = await navigator.credentials.create({
                            publicKey: {
                              challenge,
                              rp: {
                                name: "DeFi Portfolio",
                                id: window.location.hostname,
                              },
                              user: {
                                id: new TextEncoder().encode(subOrganizationId),
                                name: email,
                                displayName: email.split('@')[0],
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
                          }) as PublicKeyCredential;

                          if (credential && credential.response) {
                            const attestationResponse = credential.response as AuthenticatorAttestationResponse;
                            
                            // Register the passkey with Turnkey
                            const registerResponse = await fetch('/api/register-passkey', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                email,
                                subOrganizationId,
                                userId: email, // Use email as userId
                                credentialId: credential.id,
                                attestationObject: btoa(String.fromCharCode(...new Uint8Array(attestationResponse.attestationObject))),
                                clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(attestationResponse.clientDataJSON))),
                              }),
                            });

                            if (!registerResponse.ok) {
                              throw new Error('Failed to register passkey with Turnkey');
                            }

                            console.log('Passkey created and registered with Turnkey successfully');
                            await refreshSession();
                            onAuthSuccess?.();
                            onClose();
                          }
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to create passkey');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={!email || isLoading}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account with Passkey'}
                    </button>
                  ) : (
                    <button
                      onClick={handleEmailSubmit}
                      disabled={!email || isLoading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
                    >
                      {isLoading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                  )}
                </>
              )}

              {authMethod === 'phone' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handlePhoneSubmit}
                    disabled={!phone || isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
                  >
                    {isLoading ? 'Sending...' : 'Send SMS Code'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Verify OTP */}
          {authStep === 'verify-otp' && (
            <div className="space-y-4">
              <button
                onClick={() => setAuthStep('enter-details')}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Enter Verification Code</h3>
                <p className="text-sm text-gray-600 mt-1">
                  We sent a 6-digit code to {authMethod === 'email' ? email : phone}
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg py-4 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <button
                onClick={handleOtpVerify}
                disabled={otpCode.length !== 6 || isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                onClick={() => {
                  if (authMethod === 'email') handleEmailSubmit();
                  else handlePhoneSubmit();
                }}
                className="w-full text-gray-600 hover:text-gray-800 text-sm"
              >
                Resend Code
              </button>
            </div>
          )}
        </div>

        {/* Footer Help */}
        <div className="px-6 pb-6">
          <div className="text-center text-xs text-gray-500">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}