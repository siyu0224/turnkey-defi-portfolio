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

    console.log('=== PERMISSION DIAGNOSIS ===');

    // 1. Check who we are
    console.log('1. Checking identity...');
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    console.log('Whoami response:', JSON.stringify(whoamiResponse, null, 2));

    // 2. Get all policies
    console.log('2. Getting all policies...');
    const policiesResponse = await turnkeyClient.getPolicies({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    console.log('Policies count:', policiesResponse.policies.length);
    
    // 3. Check if we have policies that match our user ID
    const currentUserId = whoamiResponse.userId;
    const matchingPolicies = policiesResponse.policies.filter(policy => 
      policy.consensus.includes(currentUserId)
    );
    console.log('Policies matching current user:', matchingPolicies.length);

    // 4. Get users in organization
    console.log('3. Getting users...');
    const usersResponse = await turnkeyClient.getUsers({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    console.log('Users count:', usersResponse.users.length);

    // 5. Try a simple OTP test to see the exact error
    console.log('4. Testing OTP initiation...');
    let otpError = null;
    try {
      const testOtpResponse = await turnkeyClient.initOtpAuth({
        type: "ACTIVITY_TYPE_INIT_OTP_AUTH_V2",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          otpType: "OTP_TYPE_EMAIL",
          contact: "test@example.com",
          emailCustomization: {
            appName: "Turnkey Wallet",
          },
        },
      });
      console.log('OTP test succeeded:', testOtpResponse);
    } catch (error) {
      otpError = error;
      console.log('OTP test failed:', error);
    }

    return NextResponse.json({
      success: true,
      diagnosis: {
        currentUser: {
          userId: currentUserId,
          whoami: whoamiResponse,
        },
        policies: {
          total: policiesResponse.policies.length,
          matchingCurrentUser: matchingPolicies.length,
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
        users: {
          total: usersResponse.users.length,
          users: usersResponse.users.map(u => ({
            id: u.userId,
            name: u.userName,
            userEmail: u.userEmail,
          })),
        },
        otpTest: {
          error: otpError ? (otpError instanceof Error ? otpError.message : String(otpError)) : null,
        },
        environment: {
          orgId: process.env.TURNKEY_ORGANIZATION_ID,
          publicKey: process.env.TURNKEY_API_PUBLIC_KEY,
        },
      },
    });

  } catch (error) {
    console.error("Diagnosis error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Diagnosis failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to run permission diagnosis" });
}