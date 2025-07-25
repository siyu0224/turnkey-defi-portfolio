"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTurnkey } from '@turnkey/sdk-react';

interface User {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  phone?: string;
  authMethod: 'google' | 'apple' | 'facebook' | 'microsoft' | 'discord' | 'twitter' | 'github' | 'auth0' | 'cognito' | 'okta' | 'email' | 'phone' | 'passkey';
  subOrganizationId?: string;
  authenticators?: string[];
  oauthProviders?: string[];
  sessionExpires?: Date;
  recoveryMethods?: string[];
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  linkedAccounts?: { provider: string; email?: string; }[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getAuthMethods: () => Promise<string[]>;
  linkAccount: (provider: string) => Promise<void>;
  unlinkAccount: (provider: string) => Promise<void>;
  setupRecovery: (method: 'email' | 'phone') => Promise<void>;
  initiateRecovery: (identifier: string) => Promise<void>;
  completeRecovery: (code: string) => Promise<void>;
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
  const { turnkey, passkeyClient } = useTurnkey();
  
  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      if (turnkey) {
        // For now, we'll use a simplified auth check
        // In a real implementation, you would check for existing sessions
        // This is a placeholder until we understand the exact Turnkey SDK API
        const hasSession = false; // TODO: Check for actual session
        
        if (hasSession) {
          // TODO: Get actual user data from Turnkey
          // For now, set to null until we have a proper session
          setUser(null);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('No active session found:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [turnkey]);

  useEffect(() => {
    checkAuthStatus();
    
    // Set up session monitoring
    const interval = setInterval(checkAuthStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkAuthStatus]);

  // Helper functions to extract user data from Turnkey responses
  const extractNameFromProviders = (providers: Array<{claims?: {name?: string; given_name?: string; family_name?: string}}>): string | undefined => {
    for (const provider of providers || []) {
      if (provider.claims?.name) return provider.claims.name;
      if (provider.claims?.given_name && provider.claims?.family_name) {
        return `${provider.claims.given_name} ${provider.claims.family_name}`;
      }
    }
    return undefined;
  };
  
  const extractPictureFromProviders = (providers: Array<{claims?: {picture?: string; avatar_url?: string}}>): string | undefined => {
    for (const provider of providers || []) {
      if (provider.claims?.picture) return provider.claims.picture;
      if (provider.claims?.avatar_url) return provider.claims.avatar_url;
    }
    return undefined;
  };
  
  const extractPhoneFromAuthenticators = (authenticators: Array<{authenticatorName: string; phoneNumber?: string}>): string | undefined => {
    for (const auth of authenticators || []) {
      if (auth.authenticatorName.includes('PHONE') && auth.phoneNumber) {
        return auth.phoneNumber;
      }
    }
    return undefined;
  };
  
  const determineAuthMethod = (authenticators: Array<{authenticatorName: string}>, providers: Array<{providerName?: string}>): User['authMethod'] => {
    // Check OAuth providers first
    for (const provider of providers || []) {
      const providerType = provider.providerName?.toLowerCase();
      if (providerType?.includes('google')) return 'google';
      if (providerType?.includes('apple')) return 'apple';
      if (providerType?.includes('facebook')) return 'facebook';
      if (providerType?.includes('microsoft')) return 'microsoft';
      if (providerType?.includes('discord')) return 'discord';
      if (providerType?.includes('twitter')) return 'twitter';
      if (providerType?.includes('github')) return 'github';
      if (providerType?.includes('auth0')) return 'auth0';
      if (providerType?.includes('cognito')) return 'cognito';
      if (providerType?.includes('okta')) return 'okta';
    }
    
    // Check authenticators
    for (const auth of authenticators || []) {
      if (auth.authenticatorName.includes('PASSKEY')) return 'passkey';
      if (auth.authenticatorName.includes('PHONE')) return 'phone';
      if (auth.authenticatorName.includes('EMAIL')) return 'email';
    }
    
    return 'email'; // Default fallback
  };
  
  const extractRecoveryMethods = (authenticators: Array<{authenticatorName: string}>): string[] => {
    const methods: string[] = [];
    for (const auth of authenticators || []) {
      if (auth.authenticatorName.includes('EMAIL_RECOVERY')) methods.push('email');
      if (auth.authenticatorName.includes('PHONE_RECOVERY')) methods.push('phone');
    }
    return methods;
  };
  
  const checkEmailVerification = (providers: Array<{claims?: {email_verified?: boolean}}>, authenticators: Array<{authenticatorName: string; isVerified?: boolean}>): boolean => {
    // Check if email is verified in OAuth providers
    for (const provider of providers || []) {
      if (provider.claims?.email_verified === true) return true;
    }
    
    // Check if email authenticator exists
    for (const auth of authenticators || []) {
      if (auth.authenticatorName.includes('EMAIL') && auth.isVerified) return true;
    }
    
    return false;
  };
  
  const checkPhoneVerification = (authenticators: Array<{authenticatorName: string; isVerified?: boolean}>): boolean => {
    for (const auth of authenticators || []) {
      if (auth.authenticatorName.includes('PHONE') && auth.isVerified) return true;
    }
    return false;
  };
  
  const extractLinkedAccounts = (providers: Array<{providerName: string; claims?: {email?: string}}>): { provider: string; email?: string; }[] => {
    return (providers || []).map(provider => ({
      provider: provider.providerName,
      email: provider.claims?.email,
    }));
  };

  // Authentication and account management functions
  const getAuthMethods = async (): Promise<string[]> => {
    // TODO: Implement with actual Turnkey SDK API
    return [];
  };
  
  const linkAccount = async (provider: string): Promise<void> => {
    // TODO: Implement with actual Turnkey SDK API
    console.log('Linking account:', provider);
  };
  
  const unlinkAccount = async (provider: string): Promise<void> => {
    // TODO: Implement with actual Turnkey SDK API
    console.log('Unlinking account:', provider);
  };
  
  const setupRecovery = async (method: 'email' | 'phone'): Promise<void> => {
    // TODO: Implement with actual Turnkey SDK API
    console.log('Setting up recovery:', method);
  };
  
  const initiateRecovery = async (identifier: string): Promise<void> => {
    try {
      // This would typically be handled by Turnkey's recovery flow
      // Send recovery code to email or phone
      console.log('Initiating recovery for:', identifier);
      
      // In a real implementation, this would call Turnkey's recovery API
      // which sends an OTP to the provided email or phone number
    } catch (error) {
      console.error('Error initiating recovery:', error);
      throw error;
    }
  };
  
  const completeRecovery = async (code: string): Promise<void> => {
    try {
      // Complete the recovery process with the OTP code
      // and establish a new authentication credential
      console.log('Completing recovery with code:', code);
      
      // This would verify the OTP and create/restore the user session
      await checkAuthStatus(); // Refresh user data after recovery
    } catch (error) {
      console.error('Error completing recovery:', error);
      throw error;
    }
  };

  const refreshSession = async (): Promise<void> => {
    await checkAuthStatus();
  };

  const signOut = async (): Promise<void> => {
    // TODO: Clear Turnkey session with proper API
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signOut,
    refreshSession,
    getAuthMethods,
    linkAccount,
    unlinkAccount,
    setupRecovery,
    initiateRecovery,
    completeRecovery,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}