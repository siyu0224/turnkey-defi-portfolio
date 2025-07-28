import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { addWalletOwnership } from "@/lib/wallet-storage";

export async function POST(request: NextRequest) {
  try {
    const { walletName } = await request.json();

    if (!walletName) {
      return NextResponse.json(
        { error: "Wallet name is required" },
        { status: 400 }
      );
    }

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

    // Find wallet by name
    const walletsResponse = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    const wallet = walletsResponse.wallets.find(w => 
      w.walletName.toLowerCase() === walletName.toLowerCase()
    );

    if (!wallet) {
      return NextResponse.json(
        { error: `Wallet "${walletName}" not found` },
        { status: 404 }
      );
    }

    // Add ownership
    addWalletOwnership(wallet.walletId, currentUserId);

    return NextResponse.json({
      success: true,
      message: `Successfully claimed wallet "${walletName}"`,
      wallet: {
        id: wallet.walletId,
        name: wallet.walletName,
      }
    });

  } catch (error) {
    console.error("Error claiming wallet:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to claim wallet",
      },
      { status: 500 }
    );
  }
}