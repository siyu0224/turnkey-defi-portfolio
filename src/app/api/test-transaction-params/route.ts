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

    // Test 1: Try value parameter check
    try {
      const valuePolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test Transaction Value - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: "activity.resource == 'TRANSACTION' && activity.action == 'SIGN' && activity.value > 1000000000000000000",
          consensus: "true",
          notes: "Test if we can check transaction value",
        },
      });
      
      results.push({
        test: "Transaction value check (activity.value)",
        success: true,
        policyId: valuePolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "Transaction value check (activity.value)",
        success: false,
        error: error?.message,
      });
    }

    // Test 2: Try parameters.value
    try {
      const paramsValuePolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test Params Value - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: "activity.resource == 'TRANSACTION' && activity.parameters.value > 1000000000000000000",
          consensus: "true",
          notes: "Test parameters.value syntax",
        },
      });
      
      results.push({
        test: "Parameters value check (activity.parameters.value)",
        success: true,
        policyId: paramsValuePolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "Parameters value check (activity.parameters.value)",
        success: false,
        error: error?.message,
      });
    }

    // Test 3: Try data field checks
    try {
      const dataPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test Data Field - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: "activity.resource == 'TRANSACTION' && activity.data.value > 1000000000000000000",
          consensus: "true",
          notes: "Test data field access",
        },
      });
      
      results.push({
        test: "Data field check (activity.data.value)",
        success: true,
        policyId: dataPolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "Data field check (activity.data.value)",
        success: false,
        error: error?.message,
      });
    }

    // Test 4: Try transaction specific fields
    try {
      const txFieldsPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test TX Fields - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: "activity.resource == 'TRANSACTION' && activity.transaction.value > 1000000000000000000",
          consensus: "true",
          notes: "Test transaction.value syntax",
        },
      });
      
      results.push({
        test: "Transaction fields (activity.transaction.value)",
        success: true,
        policyId: txFieldsPolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "Transaction fields (activity.transaction.value)",
        success: false,
        error: error?.message,
      });
    }

    // Test 5: Try amount field
    try {
      const amountPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test Amount Field - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: "activity.resource == 'TRANSACTION' && activity.amount > 1000000000000000000",
          consensus: "true",
          notes: "Test amount field",
        },
      });
      
      results.push({
        test: "Amount field (activity.amount)",
        success: true,
        policyId: amountPolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "Amount field (activity.amount)",
        success: false,
        error: error?.message,
      });
    }

    // Test 6: Try metadata checks
    try {
      const metadataPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test Metadata - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: "activity.resource == 'TRANSACTION' && activity.metadata.value > 1000000000000000000",
          consensus: "true",
          notes: "Test metadata field access",
        },
      });
      
      results.push({
        test: "Metadata field (activity.metadata.value)",
        success: true,
        policyId: metadataPolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "Metadata field (activity.metadata.value)",
        success: false,
        error: error?.message,
      });
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
      message: "Transaction parameter tests completed. Check which syntax works!",
    });

  } catch (error: any) {
    console.error("Error in test-transaction-params:", error);
    
    return NextResponse.json(
      {
        error: "Failed to test transaction parameters",
        message: error?.message || "Unknown error",
        details: error?.response?.data || error?.details || error,
      },
      { status: 500 }
    );
  }
}