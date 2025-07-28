import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function GET() {
  try {
    console.log("=== DEBUG WALLET API ===");
    console.log("API Public Key exists:", !!process.env.TURNKEY_API_PUBLIC_KEY);
    console.log("API Private Key exists:", !!process.env.TURNKEY_API_PRIVATE_KEY);
    console.log("Organization ID:", process.env.TURNKEY_ORGANIZATION_ID);
    console.log("Base URL:", process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com");

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Test 1: Get current user
    console.log("\n1. Testing whoami...");
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    console.log("Current user ID:", whoamiResponse.userId);

    // Test 2: Get wallets list
    console.log("\n2. Getting wallets list...");
    const walletsResponse = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    console.log(`Found ${walletsResponse.wallets.length} wallets`);

    // Test 3: Try to get details for first wallet
    if (walletsResponse.wallets.length > 0) {
      console.log("\n3. Testing wallet details for first wallet...");
      const firstWallet = walletsResponse.wallets[0];
      console.log("First wallet ID:", firstWallet.walletId);
      console.log("First wallet name:", firstWallet.walletName);
      
      try {
        const walletDetails = await turnkeyClient.getWallet({
          organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
          walletId: firstWallet.walletId,
        });
        console.log("Wallet details retrieved successfully");
        console.log("Wallet has accounts:", !!(walletDetails.wallet as any).accounts);
      } catch (detailError) {
        console.error("Failed to get wallet details:", detailError);
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        apiConfigured: !!process.env.TURNKEY_API_PUBLIC_KEY && !!process.env.TURNKEY_API_PRIVATE_KEY,
        organizationId: process.env.TURNKEY_ORGANIZATION_ID,
        currentUserId: whoamiResponse.userId,
        totalWallets: walletsResponse.wallets.length,
        firstWallet: walletsResponse.wallets[0] || null,
      }
    });

  } catch (error) {
    console.error("Debug API Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}