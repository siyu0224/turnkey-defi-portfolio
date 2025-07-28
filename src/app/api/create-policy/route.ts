import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { policyName, policyType, conditions, chain } = await request.json();

    if (!policyName || !policyType || !conditions) {
      return NextResponse.json(
        { error: "Policy name, type, and conditions are required" },
        { status: 400 }
      );
    }

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Build policy condition based on type
    let policyCondition = "";
    
    if (policyType === "spending_limit") {
      // Daily spending limit policy
      policyCondition = `
        function evaluate(activity) {
          // Check if this is a sign transaction activity
          if (activity.type !== "ACTIVITY_TYPE_SIGN_TRANSACTION_V2") {
            return { allow: true };
          }
          
          // Implement daily spending limit
          const limit = ${conditions.dailyLimit || "1000000000000000000"}; // Wei
          const address = "${conditions.walletAddress}";
          
          // For demo purposes, we'll allow if under limit
          // In production, you'd track cumulative daily spending
          const value = activity.parameters?.value || "0";
          
          if (BigInt(value) > BigInt(limit)) {
            return {
              allow: false,
              reason: "Daily spending limit exceeded"
            };
          }
          
          return { allow: true };
        }
      `;
    } else if (policyType === "gas_limit") {
      // Gas price limit policy
      policyCondition = `
        function evaluate(activity) {
          if (activity.type !== "ACTIVITY_TYPE_SIGN_TRANSACTION_V2") {
            return { allow: true };
          }
          
          const maxGasPrice = "${conditions.maxGasPrice || "100000000000"}"; // Wei
          const gasPrice = activity.parameters?.gasPrice || "0";
          
          if (BigInt(gasPrice) > BigInt(maxGasPrice)) {
            return {
              allow: false,
              reason: "Gas price exceeds maximum allowed"
            };
          }
          
          return { allow: true };
        }
      `;
    } else if (policyType === "address_allowlist") {
      // Address allowlist policy
      const allowedAddresses = conditions.allowedAddresses || [];
      policyCondition = `
        function evaluate(activity) {
          if (activity.type !== "ACTIVITY_TYPE_SIGN_TRANSACTION_V2") {
            return { allow: true };
          }
          
          const allowlist = ${JSON.stringify(allowedAddresses)};
          const toAddress = activity.parameters?.to || "";
          
          if (!allowlist.includes(toAddress.toLowerCase())) {
            return {
              allow: false,
              reason: "Recipient address not in allowlist"
            };
          }
          
          return { allow: true };
        }
      `;
    } else if (policyType === "time_based") {
      // Time-based restrictions
      policyCondition = `
        function evaluate(activity) {
          if (activity.type !== "ACTIVITY_TYPE_SIGN_TRANSACTION_V2") {
            return { allow: true };
          }
          
          const startHour = ${conditions.startHour || 9};
          const endHour = ${conditions.endHour || 17};
          
          const now = new Date();
          const currentHour = now.getUTCHours();
          
          if (currentHour < startHour || currentHour >= endHour) {
            return {
              allow: false,
              reason: "Transactions only allowed during business hours"
            };
          }
          
          return { allow: true };
        }
      `;
    }

    // Create the policy using the correct API structure
    const policyResponse = await turnkeyClient.createPolicy({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: policyName,
        effect: "EFFECT_DENY", // Deny by default, allow only when conditions are met
        condition: policyCondition,
        notes: `Automated policy created for ${policyType}`,
      },
    });

    return NextResponse.json({
      success: true,
      policy: {
        id: policyResponse.activity.id,
        name: policyName,
        type: policyType,
        chain: chain || 'all',
        status: "active",
        createdAt: new Date().toISOString(),
      },
      message: `Policy "${policyName}" created successfully!`,
    });

  } catch (error) {
    console.error("Error creating policy:", error);
    
    // Check if it's a Turnkey API error
    if (error instanceof Error && error.message.includes("policy")) {
      return NextResponse.json(
        {
          error: "Policy creation is not available in your Turnkey plan. Please upgrade to use this feature.",
          details: error.message
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create policy",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}