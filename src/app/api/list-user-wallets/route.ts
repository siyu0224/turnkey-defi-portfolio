import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { getWalletsByUser } from "@/lib/wallet-storage";

export async function POST() {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Get current user
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    const currentUserId = whoamiResponse.userId;

    // Get user's wallet IDs from our storage
    const userWalletIds = getWalletsByUser(currentUserId);
    console.log(`User ${currentUserId} owns ${userWalletIds.length} wallets`);

    // Get all wallets from Turnkey
    const response = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    // Show user's wallets first, then show a few unclaimed ones
    const userWallets = response.wallets.filter(wallet => 
      userWalletIds.includes(wallet.walletId)
    );
    
    // If user has no wallets, show first 5 unclaimed wallets they can claim
    const unclaimedWallets = userWalletIds.length === 0 
      ? response.wallets.slice(0, 5).map(w => ({ ...w, unclaimed: true }))
      : [];

    // Combine user wallets and unclaimed wallets
    const allWalletsToShow = [...userWallets, ...unclaimedWallets];

    // Get actual wallet accounts for each wallet
    const walletsWithInfo = await Promise.all(
      allWalletsToShow.map(async (wallet) => {
        try {
          // Try to get wallet accounts
          const accountsResponse = await turnkeyClient.getWalletAccounts({
            organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
            walletId: wallet.walletId,
          });

          // Map blockchain information
          const blockchainMapping: Record<string, string> = {
            'BLOCKCHAIN_ETHEREUM': 'ethereum',
            'BLOCKCHAIN_POLYGON': 'polygon',
            'BLOCKCHAIN_ARBITRUM': 'arbitrum',
            'BLOCKCHAIN_OPTIMISM': 'optimism',
            'BLOCKCHAIN_BASE': 'base',
          };

          // Extract unique blockchains from accounts
          const chains = [...new Set(accountsResponse.accounts?.map(acc => 
            blockchainMapping[acc.blockchain] || 'ethereum'
          ))];

          return {
            id: wallet.walletId,
            name: wallet.walletName,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
            exported: wallet.exported || false,
            imported: wallet.imported || false,
            accounts: accountsResponse.accounts || [{
              address: `${wallet.walletId.substring(0, 6)}...${wallet.walletId.substring(wallet.walletId.length - 4)}`,
              blockchain: 'BLOCKCHAIN_ETHEREUM',
              addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
              curveType: 'secp256k1'
            }],
            chains: chains,
            primaryBlockchain: chains[0] || 'ethereum',
            unclaimed: (wallet as any).unclaimed || false,
          };
        } catch (error) {
          console.log(`Could not get accounts for wallet ${wallet.walletId}, using placeholder`);
          // If getWalletAccounts fails, return with placeholder
          return {
            id: wallet.walletId,
            name: wallet.walletName,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
            exported: wallet.exported || false,
            imported: wallet.imported || false,
            accounts: [{
              address: `${wallet.walletId.substring(0, 6)}...${wallet.walletId.substring(wallet.walletId.length - 4)}`,
              blockchain: 'Ethereum',
              addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
              curveType: 'secp256k1'
            }],
            primaryBlockchain: 'Ethereum',
            unclaimed: (wallet as any).unclaimed || false,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      wallets: walletsWithInfo,
      count: walletsWithInfo.length,
      currentUserId: currentUserId,
    });

  } catch (error) {
    console.error("Error listing user wallets:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list wallets",
        wallets: []
      },
      { status: 500 }
    );
  }
}