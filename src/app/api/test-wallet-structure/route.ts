import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function GET() {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Get wallets list
    const walletsResponse = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    if (walletsResponse.wallets.length === 0) {
      return NextResponse.json({ error: "No wallets found" });
    }

    // Get details for first wallet
    const firstWallet = walletsResponse.wallets[0];
    const walletDetails = await turnkeyClient.getWallet({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      walletId: firstWallet.walletId,
    });

    // Try different ways to access the data
    const wallet = walletDetails.wallet;
    const walletAny = wallet as any;

    // Check all possible fields
    const structure = {
      walletId: firstWallet.walletId,
      walletName: firstWallet.walletName,
      hasWallet: !!wallet,
      walletKeys: wallet ? Object.keys(wallet) : [],
      directAccounts: (wallet as any).accounts,
      addresses: (wallet as any).addresses,
      walletAddresses: (wallet as any).walletAddresses,
      // Check if addresses might be in the root response
      responseKeys: Object.keys(walletDetails),
      fullWallet: wallet,
    };

    return NextResponse.json({
      success: true,
      walletStructure: structure,
      rawResponse: walletDetails,
    });

  } catch (error) {
    console.error("Test API Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}