import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";
import { addWalletUserMapping } from "@/lib/wallet-user-mapping";

export async function POST(request: NextRequest) {
  try {
    const { walletName } = await request.json();

    if (!walletName || typeof walletName !== 'string') {
      return NextResponse.json(
        { error: "Wallet name is required and must be a string" },
        { status: 400 }
      );
    }

    console.log("Creating wallet with name:", walletName);

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
    console.log('Creating wallet for user:', currentUserId);

    // Use activity poller to ensure wallet creation completes
    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createWallet,
    });

    const activity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_WALLET",
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        walletName,
        accounts: [
          {
            curve: "CURVE_SECP256K1",
            pathFormat: "PATH_FORMAT_BIP32",
            path: "m/44'/60'/0'/0/0",
            addressFormat: "ADDRESS_FORMAT_ETHEREUM",
          },
        ],
      },
      timestampMs: Date.now().toString(),
    });

    if (activity.status === "ACTIVITY_STATUS_COMPLETED") {
      const walletId = activity.result?.createWalletResult?.walletId;
      const addresses = activity.result?.createWalletResult?.addresses;

      // Track wallet-user association
      if (walletId) {
        addWalletUserMapping(walletId, currentUserId);
      }

      return NextResponse.json({
        success: true,
        wallet: {
          id: walletId,
          name: walletName,
          addresses: addresses,
          createdAt: new Date().toISOString(),
          userId: currentUserId,
        },
        message: `Wallet "${walletName}" created successfully!`,
      });
    } else {
      throw new Error(`Wallet creation failed with status: ${activity.status}`);
    }

  } catch (error) {
    console.error("Error creating wallet:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create wallet",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}