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

    console.log('=== DEEP DIAGNOSIS START ===');

    const results = {
      timestamp: new Date().toISOString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      tests: [] as string[],
      errors: [] as string[],
      rootCause: '',
    };

    // Test 1: Check identity
    try {
      const whoamiResponse = await turnkeyClient.getWhoami({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      });
      results.tests.push(`✅ Identity: User ${whoamiResponse.userId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.errors.push(`❌ Identity failed: ${errorMsg}`);
    }

    // Test 2: Check policies
    try {
      const policiesResponse = await turnkeyClient.getPolicies({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      });
      results.tests.push(`✅ Policies: Found ${policiesResponse.policies.length} policies`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.errors.push(`❌ Policies failed: ${errorMsg}`);
    }

    // Test 3: Test OTP directly
    try {
      await turnkeyClient.initOtpAuth({
        type: "ACTIVITY_TYPE_INIT_OTP_AUTH_V2",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          otpType: "OTP_TYPE_EMAIL",
          contact: "diagnostic-test@example.com",
          emailCustomization: { appName: "Deep Diagnosis Test" },
        },
      });
      results.tests.push(`✅ OTP Test: WORKS - Email OTP can be initiated`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.errors.push(`❌ OTP Test failed: ${errorMsg}`);
    }

    // Determine root cause
    if (results.errors.length === 0) {
      results.rootCause = "All tests passed - OTP should be working!";
    } else if (results.errors.some(e => e.includes('Identity failed'))) {
      results.rootCause = "API key authentication is failing";
    } else if (results.errors.some(e => e.includes('Policies failed'))) {
      results.rootCause = "Cannot access policies - permission issue";
    } else if (results.errors.some(e => e.includes('OTP Test failed'))) {
      results.rootCause = "OTP feature is blocked - likely needs organization-level enablement";
    } else {
      results.rootCause = "Unknown issue - check individual test results";
    }

    console.log('=== DEEP DIAGNOSIS COMPLETE ===');
    console.log('ROOT CAUSE:', results.rootCause);

    return NextResponse.json({
      success: true,
      diagnosis: results,
      summary: `Root cause: ${results.rootCause}`,
    });

  } catch (error) {
    console.error("Deep diagnosis failed:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Deep diagnosis failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to run deep diagnosis" });
}