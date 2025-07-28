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

    // Get current user
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    const userId = whoamiResponse.userId;
    
    console.log('Creating simple policy for user:', userId);

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPolicy,
    });

    // Create a very simple policy - allow all for the specific user
    const policyActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: "Simple Universal Policy",
        effect: "EFFECT_ALLOW",
        consensus: `approvers.contains('${userId}')`, // Try simpler consensus
        condition: "true",
        notes: "Simple universal access policy",
      },
    });

    console.log('Policy creation result:', policyActivity);

    if (policyActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "Simple universal policy created",
        policyId: policyActivity.result.createPolicyResult?.policyId,
        consensus: `approvers.contains('${userId}')`,
      });
    } else {
      throw new Error(`Policy creation failed: ${policyActivity.status}`);
    }

  } catch (error) {
    console.error("Error creating simple policy:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create simple policy",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create simple policy" });
}