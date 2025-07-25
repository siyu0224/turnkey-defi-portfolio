import { NextRequest, NextResponse } from "next/server";
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

    const response = await turnkeyClient.getPrivateKeys({
      organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
    });

    return NextResponse.json({ 
      success: true, 
      privateKeys: response.privateKeys
    });
  } catch (error) {
    console.error("Error getting private keys:", error);
    return NextResponse.json(
      { 
        error: "Failed to get private keys",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}