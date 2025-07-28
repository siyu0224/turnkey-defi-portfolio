import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST() {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    console.log('Checking organization features and settings...');

    // Get organization details
    const orgResponse = await turnkeyClient.getOrganization({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    // Get current user
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    // Get all activities to see what's been attempted
    const activitiesResponse = await turnkeyClient.getActivities({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      paginationOptions: { limit: "10" },
    });

    const summary = {
      organization: {
        id: orgResponse.organizationData?.organizationId,
        name: orgResponse.organizationData?.name,
      },
      user: {
        id: whoamiResponse.userId,
        organizationId: whoamiResponse.organizationId,
      },
      recentActivities: activitiesResponse.activities.map(a => ({
        type: a.type,
        status: a.status,
        createdAt: a.createdAt,
      })),
      supportInfo: {
        message: "To enable OTP, contact Turnkey support with this information",
        orgId: process.env.TURNKEY_ORGANIZATION_ID,
        requestedFeatures: ["ACTIVITY_TYPE_INIT_OTP_AUTH_V2", "ACTIVITY_TYPE_OTP_AUTH"],
        reason: "Need email OTP authentication for wallet application",
      }
    };

    return NextResponse.json({
      success: true,
      data: summary,
      nextSteps: [
        "1. Contact Turnkey support via their website or Discord",
        "2. Provide your organization ID: " + process.env.TURNKEY_ORGANIZATION_ID,
        "3. Request to enable OTP authentication features",
        "4. Mention you need ACTIVITY_TYPE_INIT_OTP_AUTH_V2 and ACTIVITY_TYPE_OTP_AUTH",
        "5. Once enabled, the email authentication will work automatically"
      ]
    });

  } catch (error) {
    console.error("Organization check error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to check organization",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to check organization features" });
}