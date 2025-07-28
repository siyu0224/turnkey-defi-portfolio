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

    console.log('Creating OTP-specific permission policy...');

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPolicy,
    });

    const timestamp = Date.now();
    
    // Create a policy specifically for OTP operations
    const policyActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: timestamp.toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: `OTP Permission Policy ${timestamp}`,
        effect: "EFFECT_ALLOW",
        consensus: "true", // No approval needed
        condition: `activity.type == 'ACTIVITY_TYPE_INIT_OTP_AUTH_V2' || activity.type == 'ACTIVITY_TYPE_OTP_AUTH'`, // Specifically allow OTP activities
        notes: "Policy to specifically allow OTP authentication activities",
      },
    });

    console.log('OTP permission policy result:', policyActivity);

    if (policyActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      // Test if OTP works now
      try {
        console.log('Testing OTP after policy creation...');
        await turnkeyClient.initOtpAuth({
          type: "ACTIVITY_TYPE_INIT_OTP_AUTH_V2",
          timestampMs: Date.now().toString(),
          organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
          parameters: {
            otpType: "OTP_TYPE_EMAIL",
            contact: "otp-test@example.com",
            emailCustomization: {
              appName: "OTP Permission Test",
            },
          },
        });

        return NextResponse.json({
          success: true,
          message: "✅ OTP Permission Fixed! OTP authentication now works.",
          policyId: policyActivity.result.createPolicyResult?.policyId,
          note: "You can now use email authentication",
        });

      } catch (otpError) {
        console.log('OTP still fails after policy:', otpError);
        
        return NextResponse.json({
          success: false,
          message: "Policy created but OTP still fails",
          policyId: policyActivity.result.createPolicyResult?.policyId,
          otpError: otpError instanceof Error ? otpError.message : String(otpError),
          suggestion: "The policy was created but OTP still doesn't work. Try the Universal Policy next.",
        });
      }

    } else {
      throw new Error(`Policy creation failed: ${policyActivity.status}`);
    }

  } catch (error) {
    console.error("OTP permission fix error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "OTP permission fix failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create OTP permission policy" });
}