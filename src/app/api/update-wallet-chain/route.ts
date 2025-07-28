import { NextRequest, NextResponse } from "next/server";
import { getWalletMetadata, addWalletOwnership } from "@/lib/wallet-storage";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { walletId, chains } = await request.json();

    if (!walletId || !chains || !Array.isArray(chains) || chains.length === 0) {
      return NextResponse.json(
        { error: "Wallet ID and at least one chain are required" },
        { status: 400 }
      );
    }

    // Get current user ID
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    const currentUserId = whoamiResponse.userId;

    // Update wallet metadata
    addWalletOwnership(walletId, currentUserId, chains);

    return NextResponse.json({
      success: true,
      message: "Wallet chain updated successfully",
      chains: chains,
      primaryBlockchain: chains[0]
    });

  } catch (error) {
    console.error("Error updating wallet chain:", error);
    return NextResponse.json(
      { error: "Failed to update wallet chain" },
      { status: 500 }
    );
  }
}