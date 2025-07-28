// Simple in-memory storage for wallet-user mapping
// In production, this should be replaced with a proper database

interface WalletUserMapping {
  walletId: string;
  userId: string;
  createdAt: string;
}

// This will reset on server restart - use a database in production
const walletUserMappings: WalletUserMapping[] = [];

export function addWalletUserMapping(walletId: string, userId: string) {
  const mapping: WalletUserMapping = {
    walletId,
    userId,
    createdAt: new Date().toISOString(),
  };
  
  // Check if mapping already exists
  const existingIndex = walletUserMappings.findIndex(m => m.walletId === walletId);
  if (existingIndex >= 0) {
    walletUserMappings[existingIndex] = mapping;
  } else {
    walletUserMappings.push(mapping);
  }
  
  console.log(`Added wallet mapping: ${walletId} -> ${userId}`);
  console.log('Total mappings:', walletUserMappings.length);
}

export function getWalletsByUserId(userId: string): string[] {
  const userWallets = walletUserMappings
    .filter(m => m.userId === userId)
    .map(m => m.walletId);
  
  console.log(`Found ${userWallets.length} wallets for user ${userId}`);
  return userWallets;
}

export function getAllMappings(): WalletUserMapping[] {
  return [...walletUserMappings];
}

// For demo purposes - pre-populate with some existing wallet mappings
// This helps identify which wallets belong to which users
export function initializeDemoMappings() {
  // You can add known wallet-user mappings here if needed
  console.log('Wallet-user mapping system initialized');
}