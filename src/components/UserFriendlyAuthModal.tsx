"use client";

import { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import FallbackAuth from './FallbackAuth';

interface UserFriendlyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
  initialMode?: 'signin' | 'signup';
}

export default function UserFriendlyAuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess,
  onAuthError,
  initialMode = 'signin'
}: UserFriendlyAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showAuthComponent, setShowAuthComponent] = useState(false);
  const { refreshSession } = useAuth();
  
  const handleAuthSuccess = async () => {
    console.log('Authentication successful');
    await refreshSession();
    onAuthSuccess?.();
    onClose();
  };
  
  const handleAuthError = (errorMessage: string) => {
    onAuthError?.(errorMessage);
    console.error('Authentication error:', errorMessage);
  };
  
  const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
    console.log('Google OAuth Success:', credentialResponse);
    // TODO: Create Turnkey sub-organization with Google OAuth token
    // For now, just proceed to success
    handleAuthSuccess();
  };
  
  const handleGoogleError = () => {
    handleAuthError('Google authentication failed');
  };
  
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'demo-client-id';
  
  if (!isOpen) return null;
  
  if (showAuthComponent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative">
          <div className="p-6">
            <button
              onClick={() => setShowAuthComponent(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-6 mt-8">
              <h2 className="text-xl font-bold text-gray-900">
                Complete Your {mode === 'signup' ? 'Sign Up' : 'Sign In'}
              </h2>
            </div>
            
            <FallbackAuth
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold">T</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {mode === 'signin' ? 'Welcome Back!' : 'Create Your Account'}
            </h1>
            <p className="text-blue-100">
              {mode === 'signin' 
                ? 'Sign in to access your secure wallet' 
                : 'Get started with your secure DeFi portfolio'}
            </p>
          </div>
        </div>
        
        {/* Mode Switcher */}
        <div className="flex bg-gray-100">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-4 font-semibold transition-all ${
              mode === 'signin' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-4 font-semibold transition-all ${
              mode === 'signup' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>
        
        {/* Main Content */}
        <div className="p-8">
          <div className="space-y-4">
            {/* Passkey Option - Most Prominent */}
            <button
              onClick={() => setShowAuthComponent(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">
                      {mode === 'signup' ? 'Sign Up' : 'Sign In'} with Passkey
                    </div>
                    <div className="text-sm opacity-90">
                      Use Face ID, Touch ID, or Windows Hello
                    </div>
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-semibold">
                  RECOMMENDED
                </div>
              </div>
            </button>
            
            {/* Other Auth Options */}
            <button
              onClick={() => setShowAuthComponent(true)}
              className="w-full bg-white border-2 border-gray-200 p-4 rounded-xl hover:border-blue-500 hover:shadow-md transform hover:scale-[1.01] transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">
                      {mode === 'signup' ? 'Sign Up' : 'Sign In'} with Email
                    </div>
                    <div className="text-sm text-gray-600">
                      Receive a secure code via email
                    </div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            <button
              onClick={() => setShowAuthComponent(true)}
              className="w-full bg-white border-2 border-gray-200 p-4 rounded-xl hover:border-blue-500 hover:shadow-md transform hover:scale-[1.01] transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">
                      {mode === 'signup' ? 'Sign Up' : 'Sign In'} with Phone
                    </div>
                    <div className="text-sm text-gray-600">
                      Receive a secure code via SMS
                    </div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            {/* Google OAuth Option */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <GoogleOAuthProvider clientId={googleClientId}>
              <div className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-bold text-gray-900">
                    {mode === 'signup' ? 'Sign Up' : 'Sign In'} with Google
                  </span>
                  {googleClientId === 'demo-client-id' && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                      DEMO
                    </span>
                  )}
                </div>
                
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text={mode === 'signup' ? 'signup_with' : 'signin_with'}
                  width="100%"
                />
                
                {googleClientId === 'demo-client-id' && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Demo mode - Add NEXT_PUBLIC_GOOGLE_CLIENT_ID for real Google OAuth
                  </p>
                )}
              </div>
            </GoogleOAuthProvider>
          </div>
          
          {/* Benefits */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Why choose Turnkey?</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">No passwords needed</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">Hardware security</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">Instant setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">Recovery options</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}