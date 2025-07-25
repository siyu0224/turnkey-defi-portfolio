"use client";

import { useState } from 'react';

interface MessageSigningCardProps {
  onSignMessage: (message: string, scenario: string) => Promise<void>;
  isLoading: boolean;
}

interface SigningScenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  message: string;
  buttonText: string;
  successText: string;
}

const signingScenarios: SigningScenario[] = [
  {
    id: 'uniswap',
    title: 'Connect to Uniswap',
    description: 'Authorize access to trade on Uniswap DEX',
    icon: '🦄',
    message: 'I want to connect my wallet to Uniswap and authorize trading. Timestamp: {{timestamp}}',
    buttonText: 'Connect to Uniswap',
    successText: 'Successfully connected to Uniswap! You can now trade tokens.'
  },
  {
    id: 'airdrop',
    title: 'Claim Token Airdrop',
    description: 'Prove wallet ownership to claim DEFI tokens',
    icon: '🪂',
    message: 'I am claiming the DEFI token airdrop for wallet {{address}}. Timestamp: {{timestamp}}',
    buttonText: 'Claim Airdrop',
    successText: 'Airdrop claim verified! Your DEFI tokens will arrive shortly.'
  },
  {
    id: 'governance',
    title: 'Vote on DAO Proposal',
    description: 'Sign to vote on Governance Proposal #42',
    icon: '🗳️',
    message: 'I vote YES on Governance Proposal #42: "Increase staking rewards to 8% APY". Wallet: {{address}}, Timestamp: {{timestamp}}',
    buttonText: 'Cast Vote',
    successText: 'Vote recorded! Thank you for participating in governance.'
  },
  {
    id: 'nft',
    title: 'Verify NFT Ownership',
    description: 'Prove you own CryptoPunks for exclusive access',
    icon: '🖼️',
    message: 'I own NFTs in wallet {{address}} and request access to the exclusive holders area. Timestamp: {{timestamp}}',
    buttonText: 'Verify NFT Ownership',
    successText: 'NFT ownership verified! Welcome to the exclusive area.'
  },
  {
    id: 'social',
    title: 'Link Twitter Account',
    description: 'Connect your wallet to your social media profile',
    icon: '🐦',
    message: 'I am linking my wallet {{address}} to my Twitter account @siyu0224. Timestamp: {{timestamp}}',
    buttonText: 'Link Twitter',
    successText: 'Twitter account linked! Your wallet is now verified on social media.'
  },
  {
    id: 'lending',
    title: 'Authorize Aave Lending',
    description: 'Sign to deposit funds into Aave lending protocol',
    icon: '🏦',
    message: 'I authorize depositing my tokens into Aave lending protocol for earning yield. Wallet: {{address}}, Timestamp: {{timestamp}}',
    buttonText: 'Authorize Lending',
    successText: 'Lending authorized! You can now earn yield on your deposits.'
  }
];

export default function MessageSigningCard({ onSignMessage, isLoading }: MessageSigningCardProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<Record<string, string>>({});

  const handleSign = async (scenario: SigningScenario) => {
    setSelectedScenario(scenario.id);
    
    // Replace placeholders with actual values
    const timestamp = new Date().toISOString();
    const address = "0xDemo...Address"; // In real app, get from wallet
    const message = scenario.message
      .replace('{{timestamp}}', timestamp)
      .replace('{{address}}', address);
    
    try {
      await onSignMessage(message, scenario.id);
      
      // Simulate successful signature
      setSignatures(prev => ({
        ...prev,
        [scenario.id]: `0x${Math.random().toString(16).substring(2, 42)}...`
      }));
    } catch (error) {
      console.error('Signing failed:', error);
    } finally {
      setSelectedScenario(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-World Message Signing</h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose a scenario where you'd actually need to sign a message to interact with DeFi protocols, 
          claim rewards, or verify ownership.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signingScenarios.map((scenario) => (
          <div key={scenario.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-start space-x-3 mb-3">
              <span className="text-2xl">{scenario.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{scenario.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
              </div>
            </div>
            
            {signatures[scenario.id] && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                <div className="text-green-800 font-semibold">✅ {signingScenarios.find(s => s.id === scenario.id)?.successText}</div>
                <div className="text-green-600 mt-1 font-mono">
                  Signature: {signatures[scenario.id]}
                </div>
              </div>
            )}
            
            <button
              onClick={() => handleSign(scenario)}
              disabled={isLoading && selectedScenario === scenario.id}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              {isLoading && selectedScenario === scenario.id ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing...
                </span>
              ) : (
                scenario.buttonText
              )}
            </button>
            
            {!signatures[scenario.id] && (
              <div className="mt-2 text-xs text-gray-500">
                <strong>Will sign:</strong> "{scenario.message.replace('{{timestamp}}', 'current time').replace('{{address}}', 'your wallet')}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}