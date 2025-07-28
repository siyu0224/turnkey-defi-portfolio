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
    const apiKey = process.env.TURNKEY_API_PUBLIC_KEY!;

    console.log('Creating policy with corrected consensus...');
    console.log('User ID:', userId);
    console.log('API Key:', apiKey);
    console.log('Match?', userId === apiKey);

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPolicy,
    });

    // Try multiple consensus formats to see which one works
    const timestamp = Date.now();
    
    // Format 1: Simple approver list
    const policyActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: timestamp.toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: `Corrected Consensus Policy ${timestamp}`,
        effect: "EFFECT_ALLOW",
        consensus: `approvers.contains('${userId}')`, // Try contains instead of any
        condition: "true",
        notes: "Policy with corrected consensus format using contains",
      },
    });

    console.log('Corrected consensus policy result:', policyActivity);

    if (policyActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "Corrected consensus policy created successfully!",
        policyId: policyActivity.result.createPolicyResult?.policyId,
        userId: userId,
        apiKey: apiKey,
        consensusUsed: `approvers.contains('${userId}')`,
      });
    } else {
      throw new Error(`Policy creation failed: ${policyActivity.status}`);
    }

  } catch (error) {
    console.error("Error creating corrected consensus policy:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create corrected consensus policy",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create corrected consensus policy" });
}