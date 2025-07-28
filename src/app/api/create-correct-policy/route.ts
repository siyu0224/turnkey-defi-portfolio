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

    // First get the correct user ID
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    const currentUserId = whoamiResponse.userId;
    
    console.log('Creating policy for user ID:', currentUserId);
    console.log('API public key:', process.env.TURNKEY_API_PUBLIC_KEY);

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPolicy,
    });

    // Create a policy with the correct user ID format
    const policyActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: "Universal Access Policy",
        effect: "EFFECT_ALLOW",
        consensus: `approvers.any(user, user.id == '${currentUserId}')`,
        condition: "true", // Allow everything
        notes: "Universal policy for API key with correct user ID",
      },
    });

    if (policyActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      const result = policyActivity.result.createPolicyResult;
      
      console.log('Policy created successfully:', result?.policyId);
      
      return NextResponse.json({
        success: true,
        message: "Universal access policy created successfully",
        policyId: result?.policyId,
        userId: currentUserId,
        consensus: `approvers.any(user, user.id == '${currentUserId}')`,
      });
    } else {
      throw new Error(`Policy creation failed: ${policyActivity.status}`);
    }

  } catch (error) {
    console.error("Error creating correct policy:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create correct policy",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create correct policy" });
}