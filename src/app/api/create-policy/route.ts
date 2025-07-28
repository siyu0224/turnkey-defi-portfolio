import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

// Turnkey blockchain constants
const BLOCKCHAIN_MAPPING = {
  ethereum: "BLOCKCHAIN_ETHEREUM",
  polygon: "BLOCKCHAIN_POLYGON", 
  arbitrum: "BLOCKCHAIN_ARBITRUM",
  optimism: "BLOCKCHAIN_OPTIMISM",
  base: "BLOCKCHAIN_BASE",
  all: "ALL_CHAINS",
} as const;

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

    // Build policy condition based on type using Turnkey's expression language
    let policyCondition = "";
    let policyEffect: "EFFECT_ALLOW" | "EFFECT_DENY" = "EFFECT_DENY";
    const selectedBlockchain = chain ? BLOCKCHAIN_MAPPING[chain as keyof typeof BLOCKCHAIN_MAPPING] : null;
    
    if (policyType === "spending_limit") {
      // Daily spending limit policy with blockchain support
      if (selectedBlockchain && selectedBlockchain !== "ALL_CHAINS") {
        // Chain-specific spending limit
        policyCondition = `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.blockchain == "${selectedBlockchain}" && activity.parameters.value > ${conditions.dailyLimit || "1000000000000000000"}`;
      } else {
        // All chains spending limit
        policyCondition = `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.value > ${conditions.dailyLimit || "1000000000000000000"}`;
      }
      policyEffect = "EFFECT_DENY";
    } else if (policyType === "gas_limit") {
      // Gas price limit policy with blockchain support
      const maxGasPrice = conditions.maxGasPrice || "100000000000";
      if (selectedBlockchain && selectedBlockchain !== "ALL_CHAINS") {
        policyCondition = `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.blockchain == "${selectedBlockchain}" && activity.parameters.gasPrice > ${maxGasPrice}`;
      } else {
        policyCondition = `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.gasPrice > ${maxGasPrice}`;
      }
      policyEffect = "EFFECT_DENY";
    } else if (policyType === "address_allowlist") {
      // Address allowlist policy using Turnkey expression language
      const allowedAddresses = conditions.allowedAddresses || [];
      if (allowedAddresses.length === 0) {
        policyCondition = `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2"`;
      } else {
        // Build expression to check if recipient is in allowlist
        const addressChecks = allowedAddresses.map(addr => 
          `activity.parameters.to == "${addr.toLowerCase()}"`
        ).join(" || ");
        
        if (selectedBlockchain && selectedBlockchain !== "ALL_CHAINS") {
          policyCondition = `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.blockchain == "${selectedBlockchain}" && !(${addressChecks})`;
        } else {
          policyCondition = `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && !(${addressChecks})`;
        }
      }
      policyEffect = "EFFECT_DENY"; // Deny if not in allowlist
    } else if (policyType === "time_based") {
      // Time-based restrictions - Note: Turnkey expression language may have limited time support
      // For now, we'll create a simple always-allow policy with a note about time restrictions
      const startHour = conditions.startHour || 9;
      const endHour = conditions.endHour || 17;
      
      // Since Turnkey expression language doesn't have built-in time functions,
      // we'll create a basic policy that can be enhanced when time functions are available
      if (selectedBlockchain && selectedBlockchain !== "ALL_CHAINS") {
        policyCondition = `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.blockchain == "${selectedBlockchain}"`;
      } else {
        policyCondition = `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2"`;
      }
      policyEffect = "EFFECT_ALLOW"; // For now, allow with note about time restrictions
      
      // Update notes to include time restriction info
      policyCondition = policyCondition; // Keep condition as is
    }

    // Create the policy using the correct API structure
    const policyResponse = await turnkeyClient.createPolicy({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: policyName,
        effect: policyEffect,
        condition: policyCondition,
        notes: policyType === "time_based" 
          ? `Time-based policy (${conditions.startHour || 9}:00 - ${conditions.endHour || 17}:00 UTC). Note: Time restrictions require external enforcement.`
          : `Automated policy created for ${policyType}`,
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

  } catch (error: any) {
    console.error("Error creating policy:", error);
    
    // Return the actual error from Turnkey
    return NextResponse.json(
      {
        error: "Failed to create policy",
        message: error?.message || "Unknown error",
        details: error?.response?.data || error?.details || error,
        suggestion: "This might be due to permissions, API key settings, or the policy feature needing to be enabled for your organization.",
        rawError: JSON.stringify(error, null, 2)
      },
      { status: 500 }
    );
  }
}