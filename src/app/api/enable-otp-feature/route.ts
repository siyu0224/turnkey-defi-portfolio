import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";

export async function POST() {
  try {
    // Use API key stamper for server-side operations
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.setOrganizationFeature,
    });

    // Enable OTP authentication feature
    console.log('Enabling OTP authentication feature...');

    const featureActivity = await activityPoller({
      type: "ACTIVITY_TYPE_SET_ORGANIZATION_FEATURE",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        name: "FEATURE_NAME_OTP_EMAIL_AUTH",
        value: "true",
      },
    });

    console.log('Feature activity:', featureActivity);

    if (featureActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "OTP email authentication feature enabled successfully",
        activity: featureActivity,
      });
    } else {
      throw new Error(`Feature enabling failed: ${featureActivity.status}`);
    }

  } catch (error) {
    console.error("Error enabling OTP feature:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to enable OTP feature",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to enable OTP feature" });
}