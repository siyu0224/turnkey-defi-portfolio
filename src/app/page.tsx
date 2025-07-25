"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserFriendlyAuthModal from "@/components/UserFriendlyAuthModal";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { isAuthenticated, user } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLoading(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } else {
      setAuthMode('signup');
      setShowSignIn(true);
    }
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowSignIn(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">T</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="block">DeFi Portfolio</span>
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Powered by Turnkey
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of decentralized finance with enterprise-grade security. 
              Manage your crypto portfolio with Turnkey&apos;s infrastructure-as-a-service platform.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleGetStarted}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:transform-none"
              >
                {loading ? "Launching Portfolio..." : 
                 isAuthenticated ? `🚀 Welcome back, ${user?.name || 'User'}!` : 
                 "🚀 Get Started Free"}
              </button>
              
              {!isAuthenticated && (
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <span className="text-gray-600">Already have an account?</span>
                  <button
                    onClick={handleSignIn}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Sign In
                  </button>
                </div>
              )}
              
              {isAuthenticated && (
                <p className="text-sm text-gray-600">
                  Signed in with {user?.authMethod === 'google' ? 'Google' : 
                                  user?.authMethod === 'apple' ? 'Apple' :
                                  user?.authMethod === 'facebook' ? 'Facebook' :
                                  user?.authMethod === 'microsoft' ? 'Microsoft' :
                                  user?.authMethod === 'github' ? 'GitHub' :
                                  user?.authMethod === 'passkey' ? 'Passkey' : 
                                  user?.authMethod === 'email' ? 'Email' :
                                  user?.authMethod === 'phone' ? 'SMS' :
                                  user?.authMethod}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Security Feature */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Enterprise Security</h3>
            <p className="text-gray-600 mb-4">
              Hardware Security Modules (HSMs) and Multi-Party Computation (MPC) protect your assets with institutional-grade security.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                HSM-backed private keys
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                MPC technology
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Zero-knowledge architecture
              </div>
            </div>
          </div>

          {/* DeFi Features */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">DeFi Integration</h3>
            <p className="text-gray-600 mb-4">
              Seamlessly interact with decentralized protocols, swap tokens, and manage your entire DeFi portfolio in one place.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Token swapping
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Yield farming
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Lending protocols
              </div>
            </div>
          </div>

          {/* Developer Experience */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">🔧</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Developer Friendly</h3>
            <p className="text-gray-600 mb-4">
              Built with Turnkey&apos;s SDK and APIs, demonstrating how easy it is to integrate enterprise-grade wallet infrastructure.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                RESTful APIs
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                TypeScript SDK
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Comprehensive docs
              </div>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-16 bg-gray-900 rounded-2xl p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              🎯 Demo Application - v2.0
            </h3>
            <p className="text-gray-300 mb-6">
              This is a proof-of-concept application showcasing Turnkey&apos;s embedded wallet capabilities. 
              In a production environment, you would integrate these features into your existing application.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full">Next.js 15</span>
              <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full">Turnkey SDK</span>
              <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full">TypeScript</span>
              <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Friendly Auth Modal */}
      <UserFriendlyAuthModal 
        isOpen={showSignIn} 
        onClose={() => {
          setShowSignIn(false);
          // If user signed in, automatically proceed to dashboard
          if (isAuthenticated) {
            setTimeout(() => {
              router.push("/dashboard");
            }, 500);
          }
        }}
        initialMode={authMode}
        onAuthSuccess={() => {
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
        }}
      />
    </div>
  );
}
