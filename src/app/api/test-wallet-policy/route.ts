import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { walletId, walletName } = await request.json();
    
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    console.log("Testing policy creation for wallet:", walletId, walletName);

    // First, let's check if we can get wallet details
    let walletDetails;
    try {
      walletDetails = await turnkeyClient.getWallet({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        walletId: walletId,
      });
      console.log("Wallet details:", walletDetails);
    } catch (error) {
      console.error("Error getting wallet:", error);
    }

    // Try different policy creation approaches
    const results = [];

    // Approach 1: Create a simple test policy
    try {
      const testPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test - ${walletName || walletId} - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.value > 1000000000000000000`,
          notes: `Test policy for wallet ${walletId}`,
        },
      });
      
      results.push({
        approach: "Simple test policy",
        success: true,
        policyId: testPolicy.activity.id,
        status: testPolicy.activity.status,
      });
    } catch (error: any) {
      results.push({
        approach: "Simple test policy",
        success: false,
        error: error?.message || "Unknown error",
        details: error?.response?.data || error?.details,
      });
    }

    // Approach 2: Try with wallet-specific condition
    try {
      const walletPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Wallet Specific - ${walletName || walletId} - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.resource.walletId == "${walletId}" && activity.parameters.value > 1000000000000000000`,
          notes: `Wallet-specific policy for ${walletId}`,
        },
      });
      
      results.push({
        approach: "Wallet-specific condition",
        success: true,
        policyId: walletPolicy.activity.id,
        status: walletPolicy.activity.status,
      });
    } catch (error: any) {
      results.push({
        approach: "Wallet-specific condition",
        success: false,
        error: error?.message || "Unknown error",
        details: error?.response?.data || error?.details,
      });
    }

    // Approach 3: Try with organizationId in condition
    try {
      const orgPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Org Wallet - ${walletName || walletId} - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.organizationId == "${process.env.TURNKEY_ORGANIZATION_ID}" && activity.parameters.value > 1000000000000000000`,
          notes: `Organization-scoped policy for wallet ${walletId}`,
        },
      });
      
      results.push({
        approach: "Organization-scoped condition",
        success: true,
        policyId: orgPolicy.activity.id,
        status: orgPolicy.activity.status,
      });
    } catch (error: any) {
      results.push({
        approach: "Organization-scoped condition",
        success: false,
        error: error?.message || "Unknown error",
        details: error?.response?.data || error?.details,
      });
    }

    // Get all policies to see what exists
    let allPolicies: any[] = [];
    try {
      const policiesResponse = await turnkeyClient.getPolicies({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      });
      allPolicies = policiesResponse.policies || [];
    } catch (error) {
      console.error("Error getting policies:", error);
      allPolicies = [];
    }

    return NextResponse.json({
      success: true,
      walletId,
      walletName,
      walletDetails: walletDetails?.wallet,
      testResults: results,
      totalPolicies: allPolicies?.length || 0,
      recentPolicies: allPolicies?.slice(-5) || [],
      message: "Test completed - check results to see which policy creation approaches work",
    });

  } catch (error: any) {
    console.error("Error in test-wallet-policy:", error);
    
    return NextResponse.json(
      {
        error: "Failed to test wallet policy creation",
        message: error?.message || "Unknown error",
        details: error?.response?.data || error?.details || error,
      },
      { status: 500 }
    );
  }
}