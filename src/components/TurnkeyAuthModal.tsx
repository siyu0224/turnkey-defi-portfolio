"use client";

import { Auth } from '@turnkey/sdk-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TurnkeyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
  mode?: 'signin' | 'signup' | 'recovery';
}

export default function TurnkeyAuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess,
  onAuthError,
  mode = 'signin'
}: TurnkeyAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showRecoveryStep2, setShowRecoveryStep2] = useState(false);
  const { refreshSession, initiateRecovery, completeRecovery } = useAuth();
  
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);
  
  // Complete authentication configuration with ALL methods
  const authConfig = {
    // Enable all authentication methods
    emailEnabled: true,
    passkeyEnabled: true,
    phoneEnabled: true,
    
    // Enable ALL social OAuth providers
    googleEnabled: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    appleEnabled: !!process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
    facebookEnabled: !!process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
    microsoftEnabled: !!process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
    discordEnabled: !!process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
    twitterEnabled: !!process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
    githubEnabled: !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
    
    // Enterprise OAuth providers
    auth0Enabled: !!process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
    cognitoEnabled: !!process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID,
    oktaEnabled: !!process.env.NEXT_PUBLIC_OKTA_CLIENT_ID,
    
    // Advanced features
    socialLinking: process.env.NEXT_PUBLIC_ACCOUNT_LINKING_ENABLED === 'true',
    sessionLengthSeconds: 3600, // 1 hour sessions
    openOAuthInPage: false, // Open OAuth in popup vs new page
    
    // OTP configuration for email and SMS
    otpConfig: {
      alphanumeric: false, // Numeric OTP only
      otpLength: 6, // 6-digit OTP
      expirationSeconds: 300, // 5 minutes
    },
    
    // Passkey configuration
    passkeyConfig: {
      displayName: "DeFi Portfolio User",
      name: "defi-portfolio",
      timeout: 60000,
      userVerification: "preferred",
    },
    
    // Email configuration
    emailConfig: {
      fromName: process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || "DeFi Portfolio",
      fromAddress: process.env.NEXT_PUBLIC_EMAIL_FROM_ADDRESS,
      // Custom email templates (optional)
      templates: {
        welcome: "Welcome to DeFi Portfolio! Your secure wallet awaits.",
        recovery: "Your account recovery code is: {{code}}",
        verification: "Please verify your email with code: {{code}}",
      }
    },
    
    // SMS configuration
    smsConfig: {
      fromNumber: process.env.TWILIO_PHONE_NUMBER,
      // Custom SMS templates (optional)
      templates: {
        welcome: "Welcome to DeFi Portfolio! Code: {{code}}",
        recovery: "Account recovery code: {{code}}",
        verification: "Email verification code: {{code}}",
      }
    },
    
    // OAuth redirect configuration
    oauthConfig: {
      redirectUri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`,
      // Provider-specific configurations
      google: {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
      },
      apple: {
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
        scopes: ['openid', 'name', 'email'],
      },
      facebook: {
        clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
        scopes: ['email', 'public_profile'],
      },
      microsoft: {
        clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
      },
      discord: {
        clientId: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
        scopes: ['identify', 'email'],
      },
      twitter: {
        clientId: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
        scopes: ['tweet.read', 'users.read'],
      },
      github: {
        clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        scopes: ['user:email', 'read:user'],
      },
      auth0: {
        clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
        domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
      },
      cognito: {
        clientId: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID,
        domain: process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN,
      },
      okta: {
        clientId: process.env.NEXT_PUBLIC_OKTA_CLIENT_ID,
        domain: process.env.NEXT_PUBLIC_OKTA_DOMAIN,
      },
    }
  };
  
  // Order of authentication methods displayed (customize as needed)
  const configOrder = [
    "socials", // All OAuth providers grouped together
    "email",   // Email authentication with OTP
    "phone",   // SMS authentication with OTP
    "passkey"  // Passkey/WebAuthn authentication
  ];
  
  const handleAuthSuccess = async (authData: any) => {
    setIsLoading(false);
    console.log('Authentication successful:', authData);
    
    // Refresh the auth context to get updated user data
    await refreshSession();
    
    onAuthSuccess?.();
    onClose();
  };
  
  const handleAuthError = (errorMessage: string) => {
    setIsLoading(false);
    onAuthError?.(errorMessage);
    console.error('Authentication error:', errorMessage);
  };
  
  const handleRecoveryStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) return;
    
    setIsLoading(true);
    try {
      await initiateRecovery(recoveryIdentifier);
      setShowRecoveryStep2(true);
      alert(`Recovery code sent to ${recoveryIdentifier}`);
    } catch (error) {
      handleAuthError(`Failed to send recovery code: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRecoveryStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) return;
    
    setIsLoading(true);
    try {
      await completeRecovery(recoveryCode, null);
      await refreshSession();
      onAuthSuccess?.();
      onClose();
    } catch (error) {
      handleAuthError(`Recovery failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentMode === 'signin' && 'Welcome Back'}
            {currentMode === 'signup' && 'Create Your Account'}
            {currentMode === 'recovery' && 'Account Recovery'}
          </h2>
          <p className="text-gray-600">
            {currentMode === 'signin' && 'Sign in with your preferred method to access your secure wallet'}
            {currentMode === 'signup' && 'Choose your preferred authentication method to get started'}
            {currentMode === 'recovery' && 'Recover access to your account using email or phone'}
          </p>
        </div>
        
        {/* Mode Switcher */}
        {currentMode !== 'recovery' && (
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setCurrentMode('signin')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentMode === 'signin'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentMode('signup')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentMode === 'signup'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
        
        {/* Recovery Mode */}
        {currentMode === 'recovery' && (
          <div className="space-y-6">
            {!showRecoveryStep2 ? (
              <form onSubmit={handleRecoveryStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder="Enter your email or phone number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Sending...' : 'Send Recovery Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRecoveryStep2} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recovery Code
                  </label>
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="Enter the 6-digit code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-wider"
                    maxLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Recovering...' : 'Complete Recovery'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecoveryStep2(false)}
                  className="w-full text-gray-600 hover:text-gray-800 py-2"
                >
                  ← Back to Email/Phone
                </button>
              </form>
            )}
            
            <div className="text-center">
              <button
                onClick={() => setCurrentMode('signin')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Remember your credentials? Sign in
              </button>
            </div>
          </div>
        )}
        
        {/* Normal Auth Mode (Sign In / Sign Up) */}
        {currentMode !== 'recovery' && (
          <>
            {/* Turnkey Auth Component with ALL features */}
            <Auth
              authConfig={authConfig}
              configOrder={configOrder}
              onAuthSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
            
            {/* Recovery Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setCurrentMode('recovery')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Forgot your credentials? Recover account
              </button>
            </div>
          </>
        )}
        
        {/* Feature Overview */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">🔒 Security Features</h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Passkey Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>OAuth Integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Email/SMS OTP</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>Account Recovery</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>Account Linking</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              <span>HSM Security</span>
            </div>
          </div>
        </div>
        
        {/* Provider Status Indicators */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600">
            <div className="flex justify-between items-center mb-1">
              <span>OAuth Providers:</span>
              <span className="font-medium">
                {Object.values(authConfig).filter(v => v === true).length} enabled
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {authConfig.googleEnabled && <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Google</span>}
              {authConfig.appleEnabled && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Apple</span>}
              {authConfig.facebookEnabled && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Facebook</span>}
              {authConfig.microsoftEnabled && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Microsoft</span>}
              {authConfig.githubEnabled && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">GitHub</span>}
              {authConfig.discordEnabled && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">Discord</span>}
              {authConfig.twitterEnabled && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Twitter</span>}
              {authConfig.auth0Enabled && <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">Auth0</span>}
              {authConfig.cognitoEnabled && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Cognito</span>}
              {authConfig.oktaEnabled && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Okta</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}