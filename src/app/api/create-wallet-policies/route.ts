import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createWalletPolicies } from "@/lib/create-wallet-policies";

export async function POST(request: NextRequest) {
  try {
    const { walletId, walletName, chains } = await request.json();

    if (!walletId || !chains || chains.length === 0) {
      return NextResponse.json(
        { error: "Wallet ID and chains are required" },
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

    // Use the shared utility function
    const result = await createWalletPolicies(
      turnkeyClient,
      process.env.TURNKEY_ORGANIZATION_ID!,
      walletId,
      walletName || walletId,
      chains
    );

    return NextResponse.json({
      ...result,
      message: `Created ${result.totalCreated} policies for wallet`,
      walletId,
      chains,
    });

  } catch (error: any) {
    console.error("Error creating wallet policies:", error);
    
    return NextResponse.json(
      {
        error: "Failed to create wallet policies",
        message: error?.message || "Unknown error",
        details: error?.response?.data || error?.details || error,
      },
      { status: 500 }
    );
  }
}