import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json();
    
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    let policyParams;
    
    switch (testType) {
      case "allow_all":
        // Simplest possible policy - always true
        policyParams = {
          policyName: "Test Allow All Policy",
          effect: "EFFECT_ALLOW" as const,
          condition: "true",
          notes: "Always allow - test policy",
        };
        break;
        
      case "deny_all":
        // Simple deny all policy
        policyParams = {
          policyName: "Test Deny All Policy", 
          effect: "EFFECT_DENY" as const,
          condition: "true",
          notes: "Always deny - test policy",
        };
        break;
        
      case "activity_type":
        // Check activity type
        policyParams = {
          policyName: "Test Activity Type Policy",
          effect: "EFFECT_DENY" as const,
          condition: 'activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2"',
          notes: "Deny transaction signing",
        };
        break;
        
      case "spending_limit":
        // Try a spending limit condition
        policyParams = {
          policyName: "Test Spending Limit",
          effect: "EFFECT_DENY" as const, 
          condition: 'activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.value > 1000000000000000000',
          notes: "Deny transactions over 1 ETH",
        };
        break;
        
      default:
        throw new Error("Invalid test type");
    }

    console.log("Creating policy with params:", policyParams);

    const policyResponse = await turnkeyClient.createPolicy({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: policyParams,
    });

    return NextResponse.json({
      success: true,
      message: `Policy "${policyParams.policyName}" created successfully!`,
      policyId: policyResponse.activity.id,
      testType,
      condition: policyParams.condition,
      details: policyResponse,
    });

  } catch (error: any) {
    console.error("Raw error from Turnkey:", error);
    
    return NextResponse.json(
      {
        error: "Failed to create policy",
        actualError: error?.message || "Unknown error",
        errorDetails: error?.response?.data || error?.details || error,
        suggestion: "The condition syntax might be incorrect. Turnkey uses an expression language, not JavaScript.",
        attemptedCondition: request.body
      },
      { status: 500 }
    );
  }
}