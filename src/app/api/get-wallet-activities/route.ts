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

    // Try to get activities for the organization to find wallet creation
    const activitiesResponse = await turnkeyClient.getActivities({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      filterByType: ["ACTIVITY_TYPE_CREATE_WALLET"],
      paginationOptions: {
        limit: "100",
        before: undefined,
        after: undefined
      }
    });

    // Find the activity that created this wallet
    const walletCreationActivity = activitiesResponse.activities.find(activity => {
      const result = activity.result as any;
      return result?.createWalletResult?.walletId === walletId;
    });

    let creatorUserId = null;
    let creatorDetails = null;

    if (walletCreationActivity) {
      // The user ID might be in the activity's metadata or we need to check who initiated it
      creatorUserId = (walletCreationActivity as any).userId || 
                     (walletCreationActivity as any).initiatorUserId || 
                     (walletCreationActivity as any).createdBy ||
                     null;
      
      // Try to get user details if we found a userId
      if (creatorUserId) {
        try {
          const userResponse = await turnkeyClient.getUser({
            organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
            userId: creatorUserId,
          });
          creatorDetails = userResponse.user;
        } catch (error) {
          console.log("Could not fetch user details:", error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      walletId,
      creatorUserId,
      creatorDetails,
      creationActivity: walletCreationActivity,
      message: creatorUserId ? `Wallet created by user ${creatorUserId}` : 'Creator not found in recent activities'
    });

  } catch (error) {
    console.error("Error getting wallet activities:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get wallet activities",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}