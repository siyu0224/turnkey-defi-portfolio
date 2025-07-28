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

    console.log('Enabling email OTP feature for organization...');

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.setOrganizationFeature,
    });

    // Enable email OTP feature - try different formats
    const enableActivity = await activityPoller({
      type: "ACTIVITY_TYPE_SET_ORGANIZATION_FEATURE",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        name: "FEATURE_NAME_OTP_EMAIL_AUTH",  // Use the correct feature name from TypeScript
        value: "true",
      },
    });

    console.log('Enable email OTP result:', enableActivity);

    if (enableActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      // Test if OTP works now
      try {
        console.log('Testing OTP after enabling feature...');
        await turnkeyClient.initOtpAuth({
          type: "ACTIVITY_TYPE_INIT_OTP_AUTH_V2",
          timestampMs: Date.now().toString(),
          organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
          parameters: {
            otpType: "OTP_TYPE_EMAIL",
            contact: "feature-test@example.com",
            emailCustomization: {
              appName: "Turnkey Wallet",
            },
          },
        });

        return NextResponse.json({
          success: true,
          message: "🎉 EMAIL OTP ENABLED! Email authentication is now working.",
          activityId: enableActivity.id,
          note: "You can now use email authentication in your app!",
        });

      } catch (otpError) {
        console.log('OTP test after enabling:', otpError);
        
        return NextResponse.json({
          success: false,
          message: "Feature enabled but OTP test failed",
          activityId: enableActivity.id,
          otpError: otpError instanceof Error ? otpError.message : String(otpError),
          suggestion: "The feature was enabled, but OTP still fails. Try again in a moment.",
        });
      }

    } else {
      throw new Error(`Feature enable failed: ${enableActivity.status}`);
    }

  } catch (error) {
    console.error("Enable email OTP error:", error);
    
    // Check if it's a permission error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("sufficient permissions")) {
      return NextResponse.json(
        { 
          error: "Need permission to enable features",
          suggestion: "Your API key needs permission to use ACTIVITY_TYPE_SET_ORGANIZATION_FEATURE",
          details: errorMessage
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to enable email OTP feature" });
}