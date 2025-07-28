import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";

export async function POST() {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Get current user and API key info
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    const userId = whoamiResponse.userId;
    const apiKey = process.env.TURNKEY_API_PUBLIC_KEY!;

    console.log('Bootstrap fix - User ID:', userId);
    console.log('Bootstrap fix - API Key:', apiKey);
    console.log('Bootstrap fix - Keys match:', userId === apiKey);

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPolicy,
    });

    const timestamp = Date.now();

    // Create the most permissive policy possible to bootstrap permissions
    const policyActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: timestamp.toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: `Bootstrap Fix Policy ${timestamp}`,
        effect: "EFFECT_ALLOW",
        consensus: "true", // Simplest consensus - always allow
        condition: "true", // Simplest condition - allow everything
        notes: "Bootstrap policy to fix permission deadlock - allows all actions with no approval",
      },
    });

    console.log('Bootstrap policy result:', policyActivity);

    if (policyActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      // Now test if OTP works
      try {
        console.log('Testing OTP after bootstrap policy creation...');
        const testOtpResponse = await turnkeyClient.initOtpAuth({
          type: "ACTIVITY_TYPE_INIT_OTP_AUTH_V2",
          timestampMs: Date.now().toString(),
          organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
          parameters: {
            otpType: "OTP_TYPE_EMAIL",
            contact: "bootstrap-test@example.com",
            emailCustomization: {
              appName: "Turnkey Bootstrap Test",
            },
          },
        });

        console.log('✅ SUCCESS: OTP works after bootstrap policy!', testOtpResponse);

        return NextResponse.json({
          success: true,
          message: "🎉 Bootstrap successful! Permissions are now working.",
          policyId: policyActivity.result.createPolicyResult?.policyId,
          otpTestResult: "OTP authentication is now functional",
          note: "You can now use email authentication",
        });

      } catch (otpError) {
        console.log('❌ OTP still fails after bootstrap policy:', otpError);
        
        return NextResponse.json({
          success: false,
          message: "Bootstrap policy created but OTP still fails",
          policyId: policyActivity.result.createPolicyResult?.policyId,
          otpError: otpError instanceof Error ? otpError.message : String(otpError),
          diagnosis: "The policy was created successfully, but OTP authentication still fails. This suggests a deeper issue with the Turnkey organization setup.",
        });
      }

    } else {
      throw new Error(`Bootstrap policy creation failed: ${policyActivity.status}`);
    }

  } catch (error) {
    console.error("Bootstrap policy fix error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Bootstrap policy fix failed",
        details: error instanceof Error ? error.stack : undefined,
        suggestion: "The API key might not have sufficient root permissions in the organization"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create bootstrap policy and test OTP" });
}