"use client";

import { useState, useEffect } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import TurnkeyPasskeyAuth from './TurnkeyPasskeyAuth';

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
  const [otpId, setOtpId] = useState('');
  
  const { refreshSession } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setAuthMethod(null);
      setAuthStep('select-method');
      setError('');
      setEmail('');
      setPhone('');
      setOtpCode('');
      setOtpId('');
    }
  }, [isOpen]);


  const handleEmailSubmit = async () => {
    if (!email) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // For now, just simulate the OTP sending process
      setError('Email OTP feature is currently being configured. Please try again later.');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification code';
      setError(errorMessage);
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
      // For now, just show placeholder message
      setError('Email OTP verification is currently being configured. Please try again later.');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code';
      setError(errorMessage);
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
              {/* Passkey - Use proper Turnkey integration */}
              <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900">Passkey</div>
                    <div className="text-sm text-gray-600">
                      {mode === 'signup' 
                        ? 'Create secure passwordless account' 
                        : 'Sign in with your passkey'
                      }
                    </div>
                  </div>
                </div>
                
                <TurnkeyPasskeyAuth
                  mode={mode}
                  onSuccess={async (result) => {
                    console.log('Turnkey passkey success:', result);
                    await refreshSession();
                    onAuthSuccess?.();
                    onClose();
                  }}
                  onError={(error) => {
                    setError(error);
                    if (error.includes('sign up first') && mode === 'signin') {
                      setMode('signup');
                    }
                  }}
                />
              </div>

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
                  
                  <button
                    onClick={handleEmailSubmit}
                    disabled={!email || isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
                  >
                    {isLoading ? 'Sending...' : 'Send Verification Code'}
                  </button>
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