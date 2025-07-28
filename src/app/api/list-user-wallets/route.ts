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

    // If user has no tracked wallets, return empty array
    if (userWalletIds.length === 0) {
      return NextResponse.json({
        success: true,
        wallets: [],
        count: 0,
        currentUserId: currentUserId,
        message: "No wallets found for this user. Create a new wallet to get started."
      });
    }

    // Get all wallets from Turnkey
    const response = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    // Filter to only include user's wallets
    const userWallets = response.wallets.filter(wallet => 
      userWalletIds.includes(wallet.walletId)
    );

    // Get basic info for each wallet without fetching detailed accounts
    const walletsWithInfo = userWallets.map(wallet => ({
      id: wallet.walletId,
      name: wallet.walletName,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      exported: wallet.exported || false,
      imported: wallet.imported || false,
      // Provide basic placeholder data
      accounts: [{
        address: `${wallet.walletId.substring(0, 6)}...${wallet.walletId.substring(wallet.walletId.length - 4)}`,
        blockchain: 'Ethereum',
        addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
        curveType: 'secp256k1'
      }],
      primaryBlockchain: 'Ethereum',
    }));

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