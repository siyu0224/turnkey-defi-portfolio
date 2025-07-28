import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function GET() {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    console.log('=== PERMISSION TEST ===');
    console.log('Organization ID:', process.env.TURNKEY_ORGANIZATION_ID);
    console.log('API Public Key:', process.env.TURNKEY_API_PUBLIC_KEY);

    // Get current user identity
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    console.log('Current user ID:', whoamiResponse.userId);

    // Get all policies
    const policiesResponse = await turnkeyClient.getPolicies({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    console.log('Total policies:', policiesResponse.policies.length);

    // Check for policies matching this user
    const currentUserId = whoamiResponse.userId;
    const matchingPolicies = policiesResponse.policies.filter(policy => 
      policy.consensus.includes(currentUserId)
    );
    console.log('Policies matching current user:', matchingPolicies.length);

    // Check if API key matches user ID
    const apiKeyMatchesUserId = currentUserId === process.env.TURNKEY_API_PUBLIC_KEY;
    console.log('API key matches user ID:', apiKeyMatchesUserId);

    const result = {
      environment: {
        orgId: process.env.TURNKEY_ORGANIZATION_ID,
        publicKey: process.env.TURNKEY_API_PUBLIC_KEY,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      },
      identity: {
        userId: currentUserId,
        apiKeyMatchesUserId,
      },
      policies: {
        total: policiesResponse.policies.length,
        matchingUser: matchingPolicies.length,
        allPolicies: policiesResponse.policies.map(p => ({
          id: p.policyId,
          name: p.policyName,
          consensus: p.consensus,
          condition: p.condition,
          effect: p.effect,
        })),
        matchingPolicies: matchingPolicies.map(p => ({
          id: p.policyId,
          name: p.policyName,
          consensus: p.consensus,
          condition: p.condition,
          effect: p.effect,
        })),
      },
    };

    console.log('Diagnosis result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      diagnosis: result,
    });

  } catch (error) {
    console.error("Permission test error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Permission test failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}