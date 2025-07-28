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

    // Get current user info
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    const currentUserId = whoamiResponse.userId;
    console.log('Current user ID:', currentUserId);

    // Get all wallets for the organization
    const response = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    console.log(`Found ${response.wallets.length} wallets`);

    // Return simplified wallet info without fetching details
    const simplifiedWallets = response.wallets.map(wallet => ({
      id: wallet.walletId,
      name: wallet.walletName,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      exported: wallet.exported,
      imported: wallet.imported,
      // We'll set these as defaults since we're not fetching details
      accounts: [{
        address: 'Loading...',
        blockchain: 'Ethereum',
        addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
        curveType: 'secp256k1'
      }],
      primaryBlockchain: 'Ethereum',
      error: null
    }));

    return NextResponse.json({
      success: true,
      wallets: simplifiedWallets,
      count: simplifiedWallets.length,
      currentUserId: currentUserId,
      message: `Found ${simplifiedWallets.length} wallets (simplified view)`
    });

  } catch (error) {
    console.error("Error listing wallets:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list wallets",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to list wallets" });
}