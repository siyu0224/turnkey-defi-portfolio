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

    console.log('Creating universal permission policy...');

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPolicy,
    });

    const timestamp = Date.now();
    
    // Create the most permissive policy possible
    const policyActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: timestamp.toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: `Universal Allow Policy ${timestamp}`,
        effect: "EFFECT_ALLOW",
        consensus: "true", // Always approve
        condition: "", // Empty condition = allow everything
        notes: "Universal policy that allows all activities without restrictions",
      },
    });

    console.log('Universal policy result:', policyActivity);

    if (policyActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      // Test if OTP works now
      try {
        console.log('Testing OTP with universal policy...');
        await turnkeyClient.initOtpAuth({
          type: "ACTIVITY_TYPE_INIT_OTP_AUTH_V2",
          timestampMs: Date.now().toString(),
          organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
          parameters: {
            otpType: "OTP_TYPE_EMAIL",
            contact: "universal-test@example.com",
            emailCustomization: {
              appName: "Universal Policy Test",
            },
          },
        });

        return NextResponse.json({
          success: true,
          message: "🎉 UNIVERSAL POLICY SUCCESS! All permissions granted.",
          policyId: policyActivity.result.createPolicyResult?.policyId,
          note: "This policy allows ALL activities. OTP should work now!",
        });

      } catch (otpError) {
        console.log('OTP fails even with universal policy:', otpError);
        
        return NextResponse.json({
          success: false,
          message: "Universal policy created but OTP STILL fails",
          policyId: policyActivity.result.createPolicyResult?.policyId,
          otpError: otpError instanceof Error ? otpError.message : String(otpError),
          critical: "If universal policy doesn't work, this is likely an organization-level restriction",
        });
      }

    } else {
      throw new Error(`Policy creation failed: ${policyActivity.status}`);
    }

  } catch (error) {
    console.error("Universal policy fix error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Universal policy fix failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create universal policy" });
}