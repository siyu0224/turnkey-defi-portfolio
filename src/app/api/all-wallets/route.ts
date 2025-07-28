import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { getWalletsByUserId } from "@/lib/wallet-user-mapping";

export async function POST() {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Get current user info
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    const currentUserId = whoamiResponse.userId;

    // Get ALL wallets
    const response = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    // Get user's claimed wallets
    const userWalletIds = getWalletsByUserId(currentUserId);

    // Mark which wallets belong to current user
    const walletsWithOwnership = response.wallets.map(wallet => ({
      id: wallet.walletId,
      name: wallet.walletName,
      createdAt: wallet.createdAt,
      isMine: userWalletIds.includes(wallet.walletId),
      exported: wallet.exported,
      imported: wallet.imported,
    }));

    return NextResponse.json({
      success: true,
      currentUserId,
      totalWallets: walletsWithOwnership.length,
      myWallets: walletsWithOwnership.filter(w => w.isMine).length,
      wallets: walletsWithOwnership,
      message: `Found ${walletsWithOwnership.length} total wallets, ${walletsWithOwnership.filter(w => w.isMine).length} belong to you`,
    });

  } catch (error) {
    console.error("Error listing all wallets:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list all wallets",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to list all wallets" });
}