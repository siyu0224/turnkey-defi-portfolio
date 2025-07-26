import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";
import { TurnkeyActivityError } from "@turnkey/http";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Initialize Turnkey client
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Create a new sub-organization for this user
    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createSubOrganization,
    });

    const activity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V7",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        subOrganizationName: `User: ${email}`,
        rootQuorumThreshold: 1,
        rootUsers: [
          {
            userName: email,
            userEmail: email,
            authenticators: [], // Passkey will be added by the frontend
            apiKeys: [],
            oauthProviders: [],
          },
        ],
        wallet: {
          walletName: "Default Wallet",
          accounts: [
            {
              curve: "CURVE_SECP256K1",
              pathFormat: "PATH_FORMAT_BIP32",
              path: "m/44'/60'/0'/0/0",
              addressFormat: "ADDRESS_FORMAT_ETHEREUM",
            },
          ],
        },
      },
    });

    // Check if the activity was successful
    if (activity.status === "ACTIVITY_STATUS_COMPLETED") {
      const result = activity.result.createSubOrganizationResultV7;
      
      return NextResponse.json({
        success: true,
        subOrganizationId: result?.subOrganizationId,
        wallet: {
          walletId: result?.wallet?.walletId,
          addresses: result?.wallet?.addresses,
        },
      });
    } else {
      throw new Error(`Activity failed with status: ${activity.status}`);
    }

  } catch (error) {
    console.error("Error creating sub-organization:", error);
    
    if (error instanceof TurnkeyActivityError) {
      return NextResponse.json(
        { error: `Turnkey error: ${error.message}`, details: error.cause },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create sub-organization" },
      { status: 500 }
    );
  }
}