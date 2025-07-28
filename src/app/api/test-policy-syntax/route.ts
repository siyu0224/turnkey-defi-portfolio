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

    const results = [];

    // Test 1: Simple true condition (like your existing policies)
    try {
      const simplePolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test Simple True - ${Date.now()}`,
          effect: "EFFECT_ALLOW",
          condition: "true",
          consensus: "true",
          notes: "Simple test policy with true condition",
        },
      });
      
      results.push({
        test: "Simple true condition",
        success: true,
        policyId: simplePolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "Simple true condition",
        success: false,
        error: error?.message,
      });
    }

    // Test 2: Resource and action based (like your wallet creation policy)
    try {
      const resourcePolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test Resource Action - ${Date.now()}`,
          effect: "EFFECT_ALLOW",
          condition: "activity.resource == 'WALLET' && activity.action == 'CREATE'",
          consensus: "true",
          notes: "Test policy with resource and action",
        },
      });
      
      results.push({
        test: "Resource and action condition",
        success: true,
        policyId: resourcePolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "Resource and action condition",
        success: false,
        error: error?.message,
      });
    }

    // Test 3: With consensus using approvers (like your existing policies)
    try {
      const consensusPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test Consensus - ${Date.now()}`,
          effect: "EFFECT_ALLOW",
          condition: "true",
          consensus: `approvers.any(user, user.id == '${process.env.TURNKEY_API_PUBLIC_KEY}')`,
          notes: "Test policy with approver consensus",
        },
      });
      
      results.push({
        test: "Consensus with approvers",
        success: true,
        policyId: consensusPolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "Consensus with approvers",
        success: false,
        error: error?.message,
      });
    }

    // Test 4: Transaction signing policy
    try {
      const txPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test Transaction Sign - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: "activity.resource == 'TRANSACTION' && activity.action == 'SIGN'",
          consensus: "true",
          notes: "Test transaction signing policy",
        },
      });
      
      results.push({
        test: "Transaction signing condition",
        success: true,
        policyId: txPolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "Transaction signing condition",
        success: false,
        error: error?.message,
      });
    }

    return NextResponse.json({
      success: true,
      results,
      message: "Policy syntax tests completed",
    });

  } catch (error: any) {
    console.error("Error in test-policy-syntax:", error);
    
    return NextResponse.json(
      {
        error: "Failed to test policy syntax",
        message: error?.message || "Unknown error",
        details: error?.response?.data || error?.details || error,
      },
      { status: 500 }
    );
  }
}