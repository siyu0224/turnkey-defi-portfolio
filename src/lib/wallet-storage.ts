// This is a simple in-memory storage for demo purposes
// In production, use a proper database

interface WalletOwnership {
  walletId: string;
  userId: string;
  createdAt: string;
  chains?: string[];
  primaryBlockchain?: string;
}

// In-memory storage (resets on server restart)
const walletOwnerships: WalletOwnership[] = [];

export function addWalletOwnership(walletId: string, userId: string, chains?: string[]) {
  const existing = walletOwnerships.find(w => w.walletId === walletId);
  if (!existing) {
    walletOwnerships.push({
      walletId,
      userId,
      createdAt: new Date().toISOString(),
      chains,
      primaryBlockchain: chains?.[0]
    });
  }
}

export function getWalletsByUser(userId: string): string[] {
  return walletOwnerships
    .filter(w => w.userId === userId)
    .map(w => w.walletId);
}

export function getWalletMetadata(walletId: string): WalletOwnership | undefined {
  return walletOwnerships.find(w => w.walletId === walletId);
}

export function getAllOwnerships(): WalletOwnership[] {
  return walletOwnerships;
}

// Initialize with some known wallets if needed
export function initializeKnownWallets(userId: string, walletIds: string[]) {
  walletIds.forEach(walletId => {
    addWalletOwnership(walletId, userId);
  });
}