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

    // Get all policies for the organization
    const policiesResponse = await turnkeyClient.getPolicies({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    // Transform the policies into a more readable format
    const policies = policiesResponse.policies?.map(policy => ({
      id: policy.policyId,
      name: policy.policyName || 'Unnamed Policy',
      effect: policy.effect,
      condition: policy.condition || '',
      notes: policy.notes || '',
      createdAt: policy.createdAt || new Date().toISOString(),
      status: 'active' as const, // Policies are always active unless deleted
    })) || [];

    return NextResponse.json({
      success: true,
      policies,
      totalCount: policies.length,
    });

  } catch (error: any) {
    console.error("Error listing policies:", error);
    
    return NextResponse.json(
      {
        error: "Failed to list policies",
        message: error?.message || "Unknown error",
        details: error?.response?.data || error?.details || error,
      },
      { status: 500 }
    );
  }
}