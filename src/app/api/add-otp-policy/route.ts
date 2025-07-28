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

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPolicy,
    });

    // Create policy for OTP authentication
    console.log('Creating OTP authentication policy...');

    const policyActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: "OTP Authentication Policy",
        effect: "EFFECT_ALLOW",
        consensus: `approvers.any(user, user.id == '${process.env.TURNKEY_API_PUBLIC_KEY}')`,
        condition: `activity.resource == 'AUTH' || (activity.resource == 'ORGANIZATION' && activity.action == 'CREATE') || activity.resource == 'WALLET' || activity.resource == 'USER'`,
        notes: "Allows OTP authentication and sub-organization creation",
      },
    });

    if (policyActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      const result = policyActivity.result.createPolicyResult;
      
      return NextResponse.json({
        success: true,
        message: "OTP authentication policy created successfully",
        policyId: result?.policyId,
      });
    } else {
      throw new Error(`Policy creation failed: ${policyActivity.status}`);
    }

  } catch (error) {
    console.error("Error creating OTP policy:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create OTP policy",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create OTP policy" });
}