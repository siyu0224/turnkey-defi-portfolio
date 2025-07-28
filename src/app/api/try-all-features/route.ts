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

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.setOrganizationFeature,
    });

    // Try different feature name/value combinations based on TypeScript types
    const featureAttempts = [
      { name: "FEATURE_NAME_EMAIL_AUTH", value: "true" },
      { name: "FEATURE_NAME_OTP_EMAIL_AUTH", value: "true" },
      { name: "FEATURE_NAME_SMS_AUTH", value: "true" },
      { name: "FEATURE_NAME_EMAIL_RECOVERY", value: "true" },
      { name: "FEATURE_NAME_WEBHOOK", value: "true" },
      { name: "FEATURE_NAME_WEBAUTHN_ORIGINS", value: "true" },
    ];

    const results = [];

    for (const attempt of featureAttempts) {
      try {
        console.log(`Trying feature: ${attempt.name} = ${attempt.value}`);
        
        const activity = await activityPoller({
          type: "ACTIVITY_TYPE_SET_ORGANIZATION_FEATURE",
          timestampMs: Date.now().toString(),
          organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
          parameters: {
            name: attempt.name as "FEATURE_NAME_EMAIL_AUTH" | "FEATURE_NAME_OTP_EMAIL_AUTH" | "FEATURE_NAME_SMS_AUTH",
            value: String(attempt.value),
          },
        });

        results.push({
          attempt,
          success: activity.status === "ACTIVITY_STATUS_COMPLETED",
          status: activity.status,
        });

        // If successful, stop trying
        if (activity.status === "ACTIVITY_STATUS_COMPLETED") {
          // Test OTP
          try {
            await turnkeyClient.initOtpAuth({
              type: "ACTIVITY_TYPE_INIT_OTP_AUTH_V2",
              timestampMs: Date.now().toString(),
              organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
              parameters: {
                otpType: "OTP_TYPE_EMAIL",
                contact: "success-test@example.com",
                emailCustomization: {
                  appName: "Turnkey Wallet",
                },
              },
            });

            return NextResponse.json({
              success: true,
              message: `🎉 SUCCESS! Email OTP enabled with: ${attempt.name} = ${attempt.value}`,
              workingFormat: attempt,
              allAttempts: results,
            });
          } catch (otpError) {
            // Feature set but OTP still fails
          }
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.push({
          attempt,
          success: false,
          error: errorMsg,
        });
      }

      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      success: false,
      message: "None of the feature formats worked",
      allAttempts: results,
      suggestion: "Email OTP might not be available as a toggleable feature in your organization",
    });

  } catch (error) {
    console.error("Try all features error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to try features",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to try all feature formats" });
}