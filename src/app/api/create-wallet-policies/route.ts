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
} as const;

export async function POST(request: NextRequest) {
  try {
    const { walletId, walletName, chains } = await request.json();

    if (!walletId || !chains || chains.length === 0) {
      return NextResponse.json(
        { error: "Wallet ID and chains are required" },
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

    const createdPolicies = [];
    const errors = [];

    // Create default policies for each chain
    for (const chain of chains) {
      const blockchain = BLOCKCHAIN_MAPPING[chain as keyof typeof BLOCKCHAIN_MAPPING];
      
      if (!blockchain) {
        errors.push({ chain, error: "Unsupported blockchain" });
        continue;
      }

      try {
        // 1. Create spending limit policy for the chain
        const spendingLimitPolicy = await turnkeyClient.createPolicy({
          type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
          timestampMs: Date.now().toString(),
          organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
          parameters: {
            policyName: `${walletName || walletId} - ${chain} Spending Limit`,
            effect: "EFFECT_DENY",
            condition: `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.blockchain == "${blockchain}" && activity.parameters.value > 1000000000000000000`,
            notes: `Auto-generated policy: Deny transactions over 1 ETH equivalent on ${chain}`,
          },
        });

        createdPolicies.push({
          chain,
          type: "spending_limit",
          policyId: spendingLimitPolicy.activity.id,
          policyName: `${walletName || walletId} - ${chain} Spending Limit`,
        });

        // 2. Create gas price limit policy for the chain
        const gasLimitPolicy = await turnkeyClient.createPolicy({
          type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
          timestampMs: Date.now().toString(),
          organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
          parameters: {
            policyName: `${walletName || walletId} - ${chain} Gas Limit`,
            effect: "EFFECT_DENY",
            condition: `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.blockchain == "${blockchain}" && activity.parameters.gasPrice > 100000000000`,
            notes: `Auto-generated policy: Deny transactions with gas price over 100 Gwei on ${chain}`,
          },
        });

        createdPolicies.push({
          chain,
          type: "gas_limit",
          policyId: gasLimitPolicy.activity.id,
          policyName: `${walletName || walletId} - ${chain} Gas Limit`,
        });

      } catch (error: any) {
        console.error(`Error creating policy for ${chain}:`, error);
        errors.push({
          chain,
          error: error?.message || "Failed to create policy",
          details: error?.response?.data || error?.details,
        });
      }
    }

    // Create a global policy that applies to all chains
    try {
      const globalPolicy = await turnkeyClient.createPolicy({
        type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          policyName: `${walletName || walletId} - Global Daily Limit`,
          effect: "EFFECT_DENY",
          condition: `activity.type == "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" && activity.parameters.value > 5000000000000000000`,
          notes: `Auto-generated policy: Deny any transaction over 5 ETH equivalent across all chains`,
        },
      });

      createdPolicies.push({
        chain: "all",
        type: "global_spending_limit",
        policyId: globalPolicy.activity.id,
        policyName: `${walletName || walletId} - Global Daily Limit`,
      });
    } catch (error: any) {
      console.error("Error creating global policy:", error);
      errors.push({
        chain: "all",
        error: error?.message || "Failed to create global policy",
        details: error?.response?.data || error?.details,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdPolicies.length} policies for wallet`,
      policies: createdPolicies,
      errors: errors.length > 0 ? errors : undefined,
      walletId,
      chains,
    });

  } catch (error: any) {
    console.error("Error creating wallet policies:", error);
    
    return NextResponse.json(
      {
        error: "Failed to create wallet policies",
        message: error?.message || "Unknown error",
        details: error?.response?.data || error?.details || error,
      },
      { status: 500 }
    );
  }
}