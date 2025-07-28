import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { addWalletUserMapping } from "@/lib/wallet-user-mapping";

export async function POST(request: NextRequest) {
  try {
    const { walletId } = await request.json();

    if (!walletId) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
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

    // Get current user ID
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    const currentUserId = whoamiResponse.userId;

    // Verify wallet exists
    try {
      const walletResponse = await turnkeyClient.getWallet({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        walletId: walletId,
      });

      if (!walletResponse.wallet) {
        throw new Error("Wallet not found");
      }

      // Add mapping
      addWalletUserMapping(walletId, currentUserId);

      return NextResponse.json({
        success: true,
        message: `Wallet ${walletId} has been claimed by user ${currentUserId}`,
        wallet: walletResponse.wallet,
      });

    } catch (error) {
      console.error("Error verifying wallet:", error);
      return NextResponse.json(
        { error: "Invalid wallet ID or wallet not found" },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error("Error claiming wallet:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to claim wallet",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to claim a wallet with { walletId }" });
}