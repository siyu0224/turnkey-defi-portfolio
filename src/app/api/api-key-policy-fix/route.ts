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

    console.log('Creating policy using API key in consensus...');
    console.log('API Public Key:', process.env.TURNKEY_API_PUBLIC_KEY);

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPolicy,
    });

    // Create policy using the API key directly in consensus with unique name
    const timestamp = Date.now();
    const policyActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: timestamp.toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: `API Key Direct Policy ${timestamp}`,
        effect: "EFFECT_ALLOW",
        consensus: `approvers.any(user, user.id == '${process.env.TURNKEY_API_PUBLIC_KEY}')`,
        condition: "true", // Allow everything
        notes: "Policy using API key directly in consensus",
      },
    });

    console.log('API key policy result:', policyActivity);

    if (policyActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "API key direct policy created",
        policyId: policyActivity.result.createPolicyResult?.policyId,
        consensus: `approvers.any(user, user.id == '${process.env.TURNKEY_API_PUBLIC_KEY}')`,
        note: "Uses API key directly instead of user ID",
      });
    } else {
      throw new Error(`Policy creation failed: ${policyActivity.status}`);
    }

  } catch (error) {
    console.error("Error creating API key policy:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create API key policy",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create API key policy" });
}