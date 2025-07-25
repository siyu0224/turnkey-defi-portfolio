"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GOOGLE_OAUTH_CONFIG, GoogleUser, DEMO_GOOGLE_USER } from '@/lib/google-oauth';

interface User {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  authMethod: 'google' | 'passkey' | 'guest';
  subOrganizationId?: string;
  googleData?: GoogleUser;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPasskey: () => Promise<void>;
  signOut: () => void;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on mount
    const savedUser = localStorage.getItem('turnkey_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('turnkey_user');
      }
    }
    setIsLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const isRealOAuth = GOOGLE_OAUTH_CONFIG.CLIENT_ID !== "DEMO_CLIENT_ID_123456789";
      
      if (isRealOAuth) {
        // Real Google OAuth implementation
        // This would integrate with Google's OAuth flow
        console.log('Starting real Google OAuth flow...');
        
        // In a real implementation, you would:
        // 1. Use Google OAuth library to get authorization code
        // 2. Exchange code for user information
        // 3. Create user account with real data
        
        // For now, simulate the flow with demo data
        // but show how real data would be used
        setTimeout(() => {
          const realUser: User = {
            id: `google_${Date.now()}`,
            email: DEMO_GOOGLE_USER.email,
            name: DEMO_GOOGLE_USER.name,
            picture: DEMO_GOOGLE_USER.picture,
            authMethod: 'google',
            subOrganizationId: `sub_org_${Date.now()}`,
            googleData: DEMO_GOOGLE_USER
          };
          
          setUser(realUser);
          localStorage.setItem('turnkey_user', JSON.stringify(realUser));
          setIsLoading(false);
        }, 2000); // Simulate OAuth flow delay
        
        return;
      } else {
        // Demo mode - immediate sign-in with mock data
        console.log('Using demo Google OAuth (no real client ID configured)');
        
        const demoUser: User = {
          id: `google_demo_${Date.now()}`,
          email: DEMO_GOOGLE_USER.email,
          name: DEMO_GOOGLE_USER.name,
          picture: DEMO_GOOGLE_USER.picture,
          authMethod: 'google',
          subOrganizationId: `sub_org_demo_${Date.now()}`,
          googleData: DEMO_GOOGLE_USER
        };
        
        setUser(demoUser);
        localStorage.setItem('turnkey_user', JSON.stringify(demoUser));
      }
      
    } catch (error) {
      console.error('Google sign-in failed:', error);
      alert('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPasskey = async () => {
    setIsLoading(true);
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('Passkeys are not supported in this browser');
      }

      // First, try to authenticate with existing passkey
      try {
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32), // In production, get from server
            timeout: 60000,
            allowCredentials: [], // Empty array allows any passkey for this domain
            userVerification: 'preferred'
          }
        }) as PublicKeyCredential;

        if (credential) {
          // Successful authentication with existing passkey
          const authenticatorData = new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData);
          const credentialId = Array.from(new Uint8Array(credential.rawId))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');

          const passkeyUser: User = {
            id: `passkey_${credentialId.slice(0, 16)}`,
            name: 'Passkey User',
            authMethod: 'passkey',
            subOrganizationId: `sub_org_${Date.now()}`
          };
          
          setUser(passkeyUser);
          localStorage.setItem('turnkey_user', JSON.stringify(passkeyUser));
          return;
        }
      } catch (authError) {
        console.log('No existing passkey found, will try to register new one...');
      }

      // If authentication failed, try to register a new passkey
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32), // In production, get from server
          rp: {
            name: "DeFi Portfolio",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(`user_${Date.now()}`),
            name: "demo@example.com",
            displayName: "Demo User",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" } // RS256
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

      if (credential) {
        const credentialId = Array.from(new Uint8Array(credential.rawId))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');

        const passkeyUser: User = {
          id: `passkey_${credentialId.slice(0, 16)}`,
          name: 'Passkey User',
          authMethod: 'passkey',
          subOrganizationId: `sub_org_${Date.now()}`
        };
        
        setUser(passkeyUser);
        localStorage.setItem('turnkey_user', JSON.stringify(passkeyUser));
      }
      
    } catch (error) {
      console.error('Passkey operation failed:', error);
      let errorMessage = 'Passkey authentication failed. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotSupportedError') {
          errorMessage += 'Passkeys are not supported on this device/browser.';
        } else if (error.name === 'SecurityError') {
          errorMessage += 'Security error - make sure you\'re on HTTPS.';
        } else if (error.name === 'NotAllowedError') {
          errorMessage += 'Operation was cancelled or not allowed.';
        } else if (error.name === 'InvalidStateError') {
          errorMessage += 'A passkey is already registered for this device.';
        } else {
          errorMessage += error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = () => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: 'Guest User',
      authMethod: 'guest'
    };
    
    setUser(guestUser);
    localStorage.setItem('turnkey_user', JSON.stringify(guestUser));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('turnkey_user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signInWithGoogle,
    signInWithPasskey,
    signOut,
    continueAsGuest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}