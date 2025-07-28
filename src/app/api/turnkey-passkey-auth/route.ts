import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { WebauthnStamper } from "@turnkey/webauthn-stamper";

export async function POST(request: NextRequest) {
  try {
    const { credentialRequestOptions, assertionResponse } = await request.json();
    
    if (!credentialRequestOptions || !assertionResponse) {
      return NextResponse.json(
        { error: "Missing WebAuthn authentication data" },
        { status: 400 }
      );
    }

    // Create WebAuthn stamper for authentication
    const stamper = new WebauthnStamper({
      rpId: process.env.NEXT_PUBLIC_DOMAIN || "localhost",
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Use the WebAuthn stamper to authenticate with Turnkey
    // The stamper will handle the WebAuthn verification internally
    console.log('Authenticating with Turnkey using WebAuthn stamper');

    // Try to make a simple authenticated request to verify the passkey
    try {
      // This will use the WebAuthn stamper to sign the request
      const response = await turnkeyClient.getWhoami({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      });

      if (response && response.organizationId) {
        return NextResponse.json({
          success: true,
          organizationId: response.organizationId,
          userId: response.userId,
          username: response.username,
        });
      } else {
        throw new Error('Authentication failed - no valid response from Turnkey');
      }

    } catch (authError) {
      console.error('Turnkey authentication error:', authError);
      throw authError;
    }

  } catch (error) {
    console.error("Error in Turnkey passkey authentication:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Passkey authentication failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}