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

    // Test 1: Try eth.tx.value check
    try {
      const valuePolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test ETH TX Value - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: "activity.resource == 'TRANSACTION' && activity.action == 'SIGN' && eth.tx.value > 1000000000000000000",
          consensus: "true",
          notes: "Test if we can check ETH transaction value",
        },
      });
      
      results.push({
        test: "ETH transaction value check (eth.tx.value)",
        success: true,
        policyId: valuePolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "ETH transaction value check (eth.tx.value)",
        success: false,
        error: error?.message,
      });
    }

    // Test 2: Try eth.tx.gas_price
    try {
      const gasPricePolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test ETH Gas Price - ${Date.now()}`,
          effect: "EFFECT_DENY",
          condition: "activity.resource == 'TRANSACTION' && eth.tx.gas_price > 50000000000",
          consensus: "true",
          notes: "Test gas price limit (50 Gwei)",
        },
      });
      
      results.push({
        test: "ETH gas price check (eth.tx.gas_price)",
        success: true,
        policyId: gasPricePolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "ETH gas price check (eth.tx.gas_price)",
        success: false,
        error: error?.message,
      });
    }

    // Test 3: Try eth.tx.to address check
    try {
      const toAddressPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test ETH To Address - ${Date.now()}`,
          effect: "EFFECT_ALLOW",
          condition: "activity.resource == 'TRANSACTION' && eth.tx.to == '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'",
          consensus: "true",
          notes: "Test restricting to USDC contract address",
        },
      });
      
      results.push({
        test: "ETH to address check (eth.tx.to)",
        success: true,
        policyId: toAddressPolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "ETH to address check (eth.tx.to)",
        success: false,
        error: error?.message,
      });
    }

    // Test 4: Complex DCA policy - 100 USDC daily with gas limit
    try {
      const dcaPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `DCA Policy - 100 USDC Daily - ${Date.now()}`,
          effect: "EFFECT_ALLOW",
          condition: "activity.resource == 'TRANSACTION' && eth.tx.gas_price < 100000000000 && eth.tx.value == 0",
          consensus: "true",
          notes: "DCA: Allow transactions with gas < 100 Gwei and value = 0 (for token transfers)",
        },
      });
      
      results.push({
        test: "DCA complex policy (gas limit + value check)",
        success: true,
        policyId: dcaPolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "DCA complex policy (gas limit + value check)",
        success: false,
        error: error?.message,
      });
    }

    // Test 5: Check calldata for specific function selector
    try {
      const calldataPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `Test Calldata Check - ${Date.now()}`,
          effect: "EFFECT_ALLOW",
          condition: "activity.resource == 'TRANSACTION' && eth.tx.data != ''",
          consensus: "true",
          notes: "Test if we can check transaction calldata",
        },
      });
      
      results.push({
        test: "ETH calldata check (eth.tx.data)",
        success: true,
        policyId: calldataPolicy.activity.id,
      });
    } catch (error: any) {
      results.push({
        test: "ETH calldata check (eth.tx.data)",
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
      message: "ETH transaction parameter tests completed. These syntaxes should work based on Turnkey docs!",
    });

  } catch (error: any) {
    console.error("Error in test-eth-tx-params:", error);
    
    return NextResponse.json(
      {
        error: "Failed to test ETH transaction parameters",
        message: error?.message || "Unknown error",
        details: error?.response?.data || error?.details || error,
      },
      { status: 500 }
    );
  }
}