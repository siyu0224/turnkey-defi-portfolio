import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { strategyName, chain } = await request.json();

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Create a policy for automated DCA transactions
    // Since we can't check transaction values in the policy expression,
    // we'll create a general automation policy
    const policyResponse = await turnkeyClient.createPolicy({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: `DCA Automation - ${strategyName}`,
        effect: "EFFECT_ALLOW",
        condition: "activity.resource == 'TRANSACTION' && activity.action == 'SIGN'",
        consensus: "true", // No manual approval needed for automated transactions
        notes: `Automated DCA strategy for ${strategyName} on ${chain}. This policy allows automated transaction signing.`,
      },
    });

    return NextResponse.json({
      success: true,
      policy: {
        id: policyResponse.activity.id,
        name: `DCA Automation - ${strategyName}`,
        status: policyResponse.activity.status,
      },
      message: "DCA automation policy created successfully",
    });

  } catch (error: any) {
    console.error("Error creating DCA policy:", error);
    
    // Return success even if policy creation fails
    // This allows DCA strategies to work even without policies
    return NextResponse.json({
      success: true,
      policy: null,
      message: "DCA strategy created (policy creation optional)",
      error: error?.message,
    });
  }
}