import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";

export async function POST(request: NextRequest) {
  try {
    // Use API key stamper for server-side operations
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Get current user ID (which should be the API key)
    const userResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    const userId = userResponse.userId;
    console.log('Current user ID:', userId);

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPolicy,
    });

    // Create a new policy specifically for OTP auth with the correct user ID
    console.log('Creating comprehensive OTP policy...');

    const policyActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: "Comprehensive API Access Policy",
        effect: "EFFECT_ALLOW",
        consensus: `approvers.any(user, user.id == '${userId}')`,
        condition: "true", // Allow all actions for this API key
        notes: "Full access policy for API key operations including OTP auth",
      },
    });

    if (policyActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      const result = policyActivity.result.createPolicyResult;
      
      return NextResponse.json({
        success: true,
        message: "Comprehensive API access policy created successfully",
        policyId: result?.policyId,
        userId: userId,
      });
    } else {
      throw new Error(`Policy creation failed: ${policyActivity.status}`);
    }

  } catch (error) {
    console.error("Error creating comprehensive policy:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create comprehensive policy",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create comprehensive policy" });
}