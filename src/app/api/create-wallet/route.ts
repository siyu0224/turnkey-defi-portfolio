import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { walletName } = await request.json();

    console.log("Creating wallet with name:", walletName);
    console.log("Organization ID:", process.env.NEXT_PUBLIC_ORGANIZATION_ID);
    console.log("Base URL:", process.env.NEXT_PUBLIC_BASE_URL);

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Use the createWallet method with proper parameters structure
    const response = await turnkeyClient.createWallet({
      type: "ACTIVITY_TYPE_CREATE_WALLET",
      organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
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

    return NextResponse.json({ 
      success: true, 
      activity: response.activity,
      wallet: {
        walletId: response.activity?.result?.createWalletResult?.walletId,
        address: response.activity?.result?.createWalletResult?.addresses?.[0],
        // We'll need to get the wallet details to find the private key ID
        needsPrivateKeyId: true
      }
    });
  } catch (error) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      { 
        error: "Failed to create wallet",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}