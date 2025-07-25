"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const { getActiveClient, indexedDbClient, turnkey } = useTurnkey();

  useEffect(() => {
    const checkStatus = async () => {
      await checkAuthStatus();
    };
    
    checkStatus();
    
    // Set up session monitoring
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [getActiveClient, indexedDbClient, turnkey]);
  
  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      await indexedDbClient?.init();
      const client = await getActiveClient();
      
      if (client && turnkey) {
        // Get comprehensive user information from Turnkey
        const whoami = await client.getWhoami({
          organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
        });
        
        // Get user's authenticators and OAuth providers
        const authenticators = await client.getAuthenticators({
          organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
          userId: whoami.userId,
        });
        
        const oAuthProviders = await client.getOauthProviders({
          organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
          userId: whoami.userId,
        });
        
        // Extract user data from Turnkey response
        const userData: User = {
          id: whoami.userId || whoami.organizationId,
          email: whoami.email,
          name: whoami.username || extractNameFromProviders(oAuthProviders.oauthProviders),
          picture: extractPictureFromProviders(oAuthProviders.oauthProviders),
          phone: extractPhoneFromAuthenticators(authenticators.authenticators),
          authMethod: determineAuthMethod(authenticators.authenticators, oAuthProviders.oauthProviders),
          subOrganizationId: whoami.organizationId,
          authenticators: authenticators.authenticators?.map(auth => auth.authenticatorName) || [],
          oauthProviders: oAuthProviders.oauthProviders?.map(provider => provider.providerName) || [],
          sessionExpires: new Date(Date.now() + (3600 * 1000)), // 1 hour from now
          recoveryMethods: extractRecoveryMethods(authenticators.authenticators),
          isEmailVerified: checkEmailVerification(oAuthProviders.oauthProviders, authenticators.authenticators),
          isPhoneVerified: checkPhoneVerification(authenticators.authenticators),
          linkedAccounts: extractLinkedAccounts(oAuthProviders.oauthProviders),
        };
        
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('No active session found:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

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
    try {
      const client = await getActiveClient();
      if (!client || !user) return [];
      
      const authenticators = await client.getAuthenticators({
        organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
        userId: user.id,
      });
      
      const oAuthProviders = await client.getOauthProviders({
        organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
        userId: user.id,
      });
      
      const methods = [
        ...authenticators.authenticators?.map(auth => auth.authenticatorName) || [],
        ...oAuthProviders.oauthProviders?.map(provider => provider.providerName) || [],
      ];
      
      return methods;
    } catch (error) {
      console.error('Error getting auth methods:', error);
      return [];
    }
  };
  
  const linkAccount = async (provider: string): Promise<void> => {
    try {
      const client = await getActiveClient();
      if (!client || !user) throw new Error('Not authenticated');
      
      // This would initiate OAuth flow for account linking
      // Exact implementation depends on Turnkey's OAuth linking API
      await client.createOauthProvider({
        organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
        userId: user.id,
        oauthProvider: {
          providerName: provider,
          // Additional OAuth configuration
        }
      });
      
      await checkAuthStatus(); // Refresh user data
    } catch (error) {
      console.error('Error linking account:', error);
      throw error;
    }
  };
  
  const unlinkAccount = async (provider: string): Promise<void> => {
    try {
      const client = await getActiveClient();
      if (!client || !user) throw new Error('Not authenticated');
      
      // Find the provider to unlink
      const oAuthProviders = await client.getOauthProviders({
        organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
        userId: user.id,
      });
      
      const providerToUnlink = oAuthProviders.oauthProviders?.find(
        p => p.providerName === provider
      );
      
      if (providerToUnlink) {
        await client.deleteOauthProvider({
          organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
          oauthProviderId: providerToUnlink.oauthProviderId,
        });
      }
      
      await checkAuthStatus(); // Refresh user data
    } catch (error) {
      console.error('Error unlinking account:', error);
      throw error;
    }
  };
  
  const setupRecovery = async (method: 'email' | 'phone'): Promise<void> => {
    try {
      const client = await getActiveClient();
      if (!client || !user) throw new Error('Not authenticated');
      
      if (method === 'email') {
        // Setup email recovery
        await client.createAuthenticator({
          organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
          userId: user.id,
          authenticatorName: `EMAIL_RECOVERY_${Date.now()}`,
          challenge: '', // Challenge from server
          attestation: {
            // Email recovery attestation
          }
        });
      } else {
        // Setup phone recovery
        await client.createAuthenticator({
          organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
          userId: user.id,
          authenticatorName: `PHONE_RECOVERY_${Date.now()}`,
          challenge: '', // Challenge from server
          attestation: {
            // Phone recovery attestation
          }
        });
      }
      
      await checkAuthStatus(); // Refresh user data
    } catch (error) {
      console.error('Error setting up recovery:', error);
      throw error;
    }
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
    try {
      // Clear Turnkey session
      await indexedDbClient?.clearSession();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear user state even if Turnkey signout fails
      setUser(null);
    }
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