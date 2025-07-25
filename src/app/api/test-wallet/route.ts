import { NextResponse } from "next/server";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { TurnkeyClient } from "@turnkey/http";

export async function GET() {
  try {
    console.log("Testing wallet creation...");
    console.log("Org ID:", process.env.NEXT_PUBLIC_ORGANIZATION_ID);
    console.log("Public Key (first 8):", process.env.TURNKEY_API_PUBLIC_KEY?.slice(0, 8));
    console.log("Private Key exists:", !!process.env.TURNKEY_API_PRIVATE_KEY);
    console.log("Base URL:", process.env.NEXT_PUBLIC_BASE_URL);

    if (!process.env.TURNKEY_API_PUBLIC_KEY || !process.env.TURNKEY_API_PRIVATE_KEY) {
      return NextResponse.json({
        error: "Missing API keys",
        hasPublicKey: !!process.env.TURNKEY_API_PUBLIC_KEY,
        hasPrivateKey: !!process.env.TURNKEY_API_PRIVATE_KEY
      }, { status: 400 });
    }

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Test creating a wallet
    const response = await turnkeyClient.createWallet({
      type: "ACTIVITY_TYPE_CREATE_WALLET",
      organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
      parameters: {
        walletName: `test-wallet-${Date.now()}`,
        accounts: [{
          curve: "CURVE_SECP256K1",
          pathFormat: "PATH_FORMAT_BIP32",
          path: "m/44'/60'/0'/0/0",
          addressFormat: "ADDRESS_FORMAT_ETHEREUM",
        }],
      },
      timestampMs: Date.now().toString(),
    });

    return NextResponse.json({
      success: true,
      walletId: response.activity?.result?.createWalletResult?.walletId,
      address: response.activity?.result?.createWalletResult?.addresses?.[0],
      message: "Wallet creation test successful"
    });

  } catch (error) {
    console.error("Wallet creation test failed:", error);
    return NextResponse.json({
      error: "Wallet creation failed",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}