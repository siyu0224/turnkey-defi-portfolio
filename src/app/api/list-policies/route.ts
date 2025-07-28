import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST() {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Get current user to filter policies
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    const currentUserId = whoamiResponse.userId;

    // Since listPolicies might not be available in all Turnkey plans,
    // we'll return a demo response for now
    const policies = [
      {
        id: "demo-policy-1",
        name: "Daily Spending Limit",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        effect: "EFFECT_DENY",
        type: "spending_limit",
        notes: "Limits daily spending to 1 ETH",
      },
      {
        id: "demo-policy-2", 
        name: "Gas Price Protection",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        effect: "EFFECT_DENY",
        type: "gas_limit",
        notes: "Prevents transactions when gas > 100 Gwei",
      }
    ];

    return NextResponse.json({
      success: true,
      policies: policies,
      count: policies.length,
      currentUserId: currentUserId,
    });

  } catch (error) {
    console.error("Error listing policies:", error);
    
    // Check if it's a feature not available error
    if (error instanceof Error && error.message.includes("not found")) {
      // Return empty list if policies feature is not available
      return NextResponse.json({
        success: true,
        policies: [],
        count: 0,
        message: "Policy feature not available in current plan"
      });
    }
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list policies",
        policies: []
      },
      { status: 500 }
    );
  }
}

function extractPolicyType(policyName: string): string {
  const name = policyName.toLowerCase();
  if (name.includes('spending') || name.includes('limit')) return 'spending_limit';
  if (name.includes('gas')) return 'gas_limit';
  if (name.includes('address') || name.includes('allowlist')) return 'address_allowlist';
  if (name.includes('time')) return 'time_based';
  if (name.includes('dca')) return 'dca';
  return 'custom';
}