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

    console.log('Testing OTP after successful feature enablement...');

    // Test OTP authentication now that some features were enabled
    try {
      const otpResponse = await turnkeyClient.initOtpAuth({
        type: "ACTIVITY_TYPE_INIT_OTP_AUTH_V2",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          otpType: "OTP_TYPE_EMAIL",
          contact: "test-after-features@example.com",
          emailCustomization: {
            appName: "Turnkey Wallet Test",
          },
        },
      });

      console.log('✅ OTP SUCCESS after feature enablement:', otpResponse);

      return NextResponse.json({
        success: true,
        message: "🎉 OTP WORKS! Email authentication is now enabled!",
        otpResponse: {
          activityId: otpResponse.activity?.id,
          status: otpResponse.activity?.status,
        },
        note: "You can now use email authentication in your app!",
      });

    } catch (otpError) {
      console.log('❌ OTP still fails after feature enablement:', otpError);
      
      return NextResponse.json({
        success: false,
        message: "Features were enabled but OTP still fails",
        error: otpError instanceof Error ? otpError.message : String(otpError),
        diagnosis: "Some features were successfully enabled (FEATURE_NAME_WEBHOOK and FEATURE_NAME_WEBAUTHN_ORIGINS), but email OTP specifically is still not working.",
        nextStep: "The specific email OTP feature might need a different approach or may not be available for your organization type.",
      });
    }

  } catch (error) {
    console.error("Test OTP after features error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to test OTP after features",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to test OTP after feature enablement" });
}