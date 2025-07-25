"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { signInWithGoogle, signInWithPasskey, continueAsGuest, isLoading } = useAuth();
  const [activeMethod, setActiveMethod] = useState<'google' | 'passkey' | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setActiveMethod('google');
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setActiveMethod(null);
    }
  };

  const handlePasskeySignIn = async () => {
    setActiveMethod('passkey');
    try {
      await signInWithPasskey();
      onClose();
    } catch (error) {
      console.error('Passkey sign-in error:', error);
    } finally {
      setActiveMethod(null);
    }
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to DeFi Portfolio</h2>
          <p className="text-gray-600">Sign in to access your secure wallet and manage your crypto assets</p>
        </div>

        <div className="space-y-4">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-gray-700">
              {activeMethod === 'google' && isLoading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          {/* Passkey Sign In */}
          <button
            onClick={handlePasskeySignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 10v2h2v8h8v-8h2v-2h-2V8a4 4 0 0 0-8 0v2H6zm2-2a2 2 0 0 1 4 0v2H8V8zm1 8v2h2v-2H9zm4 0v2h2v-2h-2z"/>
            </svg>
            <span className="font-medium">
              {activeMethod === 'passkey' && isLoading ? 'Touch sensor or use Face ID...' : 'Sign in with Passkey'}
            </span>
          </button>
          
          {/* Passkey Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              🔐 Passkey uses your device&apos;s biometric authentication (Touch ID, Face ID, or Windows Hello)
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Continue as Guest */}
          <button
            onClick={handleContinueAsGuest}
            disabled={isLoading}
            className="w-full py-3 px-4 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue as Guest
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}