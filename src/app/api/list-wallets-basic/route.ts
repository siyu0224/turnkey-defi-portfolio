import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

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

    // Get all wallets - just the basic list
    const response = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    console.log(`Found ${response.wallets.length} wallets`);

    // Return wallets with minimal processing
    const wallets = response.wallets.map(wallet => ({
      id: wallet.walletId,
      name: wallet.walletName,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      exported: wallet.exported || false,
      imported: wallet.imported || false,
      // Provide placeholder data for now
      accounts: [{
        address: `${wallet.walletId.substring(0, 8)}...`,
        blockchain: 'Ethereum',
        addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
        curveType: 'secp256k1'
      }],
      primaryBlockchain: 'Ethereum',
    }));

    return NextResponse.json({
      success: true,
      wallets: wallets,
      count: wallets.length,
      currentUserId: whoamiResponse.userId,
    });

  } catch (error) {
    console.error("Error in list-wallets-basic:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list wallets",
        wallets: [] // Return empty array so UI doesn't break
      },
      { status: 500 }
    );
  }
}