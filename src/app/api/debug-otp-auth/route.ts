import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    // Use API key stamper for server-side operations
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // First, let's check who we are
    console.log('Checking identity...');
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    console.log('Whoami response:', whoamiResponse);

    // Get organization info
    console.log('Getting organization info...');
    const orgResponse = await turnkeyClient.getOrganization({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    console.log('Organization response:', orgResponse);

    // Try a simple request that doesn't require special permissions
    console.log('Listing users...');
    const usersResponse = await turnkeyClient.getUsers({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    console.log('Users response:', usersResponse);

    return NextResponse.json({
      success: true,
      debug: {
        whoami: whoamiResponse,
        organization: orgResponse,
        users: usersResponse,
        environment: {
          orgId: process.env.TURNKEY_ORGANIZATION_ID,
          publicKey: process.env.TURNKEY_API_PUBLIC_KEY,
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        },
      },
    });

  } catch (error) {
    console.error("Debug error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Debug failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to debug OTP auth" });
}