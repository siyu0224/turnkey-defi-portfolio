// This is a simple in-memory storage for demo purposes
// In production, use a proper database

interface WalletOwnership {
  walletId: string;
  userId: string;
  createdAt: string;
}

// In-memory storage (resets on server restart)
let walletOwnerships: WalletOwnership[] = [];

export function addWalletOwnership(walletId: string, userId: string) {
  const existing = walletOwnerships.find(w => w.walletId === walletId);
  if (!existing) {
    walletOwnerships.push({
      walletId,
      userId,
      createdAt: new Date().toISOString()
    });
  }
}

export function getWalletsByUser(userId: string): string[] {
  return walletOwnerships
    .filter(w => w.userId === userId)
    .map(w => w.walletId);
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