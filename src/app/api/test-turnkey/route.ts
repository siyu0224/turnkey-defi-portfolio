import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing Turnkey connectivity...");
    console.log("Organization ID:", process.env.NEXT_PUBLIC_ORGANIZATION_ID);
    console.log("Base URL:", process.env.NEXT_PUBLIC_BASE_URL);

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Try to get organization info to test connectivity
    const response = await turnkeyClient.getOrganization({
      organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
    });

    return NextResponse.json({ 
      success: true, 
      organization: response.organizationData,
      message: "Turnkey connectivity test successful"
    });
  } catch (error) {
    console.error("Turnkey connectivity test failed:", error);
    return NextResponse.json(
      { 
        error: "Turnkey connectivity test failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}