import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    console.log("Attempting to create a simple test policy...");

    // Try the simplest possible policy
    const policyResponse = await turnkeyClient.createPolicy({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: "Test Policy - Allow All",
        effect: "EFFECT_ALLOW",
        condition: "true", // Simple boolean expression
        notes: "Test policy to check if policy creation is available",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Policy created successfully!",
      policyId: policyResponse.activity.id,
      details: policyResponse,
    });

  } catch (error: any) {
    console.error("Raw error from Turnkey:", error);
    
    // Return the actual error details
    return NextResponse.json(
      {
        error: "Failed to create policy",
        actualError: error?.message || "Unknown error",
        errorDetails: error?.response?.data || error?.details || error,
        errorCode: error?.code,
        errorStatus: error?.status,
        suggestion: "Check console logs for full error details"
      },
      { status: 500 }
    );
  }
}