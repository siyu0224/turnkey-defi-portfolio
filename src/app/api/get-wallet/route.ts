import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { walletId } = await request.json();

    console.log("Getting wallet details for:", walletId);

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    const response = await turnkeyClient.getWallet({
      organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
      walletId: walletId,
    });

    return NextResponse.json({ 
      success: true, 
      wallet: response.wallet
    });
  } catch (error) {
    console.error("Error getting wallet:", error);
    return NextResponse.json(
      { 
        error: "Failed to get wallet",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}