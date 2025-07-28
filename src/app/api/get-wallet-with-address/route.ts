import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { walletId } = await request.json();

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Method 1: Try to get wallet details
    let walletData: any = {};
    try {
      const walletResponse = await turnkeyClient.getWallet({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        walletId: walletId,
      });
      walletData = walletResponse.wallet;
    } catch (error) {
      console.log("getWallet failed:", error);
    }

    // Method 2: Try to find the wallet creation activity
    let creationActivity: any = null;
    try {
      const activitiesResponse = await turnkeyClient.getActivities({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        filterByType: ["ACTIVITY_TYPE_CREATE_WALLET"],
        paginationOptions: {
          limit: "100",
          before: undefined,
          after: undefined
        }
      });

      creationActivity = activitiesResponse.activities.find(activity => {
        const result = activity.result as any;
        return result?.createWalletResult?.walletId === walletId;
      });
    } catch (error) {
      console.log("getActivities failed:", error);
    }

    // Extract addresses from creation activity
    const addresses = creationActivity?.result?.createWalletResult?.addresses || [];

    return NextResponse.json({
      success: true,
      walletId,
      wallet: walletData,
      creationActivity: creationActivity ? {
        activityId: creationActivity.id,
        addresses: addresses,
        status: creationActivity.status,
        createdAt: creationActivity.createdAt,
      } : null,
      addresses: addresses,
      message: addresses.length > 0 ? "Found addresses from creation activity" : "No addresses found"
    });

  } catch (error) {
    console.error("Error getting wallet with address:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get wallet",
    }, { status: 500 });
  }
}