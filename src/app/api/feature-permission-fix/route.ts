import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";

export async function POST() {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    console.log('Creating policy to allow feature management...');

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPolicy,
    });

    const timestamp = Date.now();
    
    // Create a policy that allows setting organization features
    const policyActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: timestamp.toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: `Feature Management Policy ${timestamp}`,
        effect: "EFFECT_ALLOW",
        consensus: "true",
        condition: `activity.type == 'ACTIVITY_TYPE_SET_ORGANIZATION_FEATURE'`,
        notes: "Policy to allow enabling/disabling organization features like email OTP",
      },
    });

    console.log('Feature policy result:', policyActivity);

    if (policyActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "✅ Feature management policy created! Now try enabling email OTP.",
        policyId: policyActivity.result.createPolicyResult?.policyId,
        nextStep: "Click the 'Enable Email OTP' button to turn on email authentication",
      });
    } else {
      throw new Error(`Policy creation failed: ${policyActivity.status}`);
    }

  } catch (error) {
    console.error("Feature policy fix error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Feature policy fix failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create feature management policy" });
}