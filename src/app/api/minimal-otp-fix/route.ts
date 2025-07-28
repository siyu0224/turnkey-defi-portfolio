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

    // Get current user
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    const userId = whoamiResponse.userId;

    console.log('Testing direct OTP call without creating new policies...');
    console.log('User ID:', userId);

    // Try to call OTP auth directly - maybe the existing policies work now
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

      console.log('SUCCESS: OTP call worked!', testOtpResponse);
      
      return NextResponse.json({
        success: true,
        message: "OTP authentication is working! The existing policies are sufficient.",
        testResult: testOtpResponse,
      });

    } catch (otpError) {
      console.log('OTP call failed:', otpError);
      
      // If direct call fails, let's try a different approach
      // Check what specific permissions we're missing
      return NextResponse.json({
        success: false,
        message: "OTP still fails - need to investigate policy conditions",
        error: otpError instanceof Error ? otpError.message : String(otpError),
        userId: userId,
        suggestion: "The policies exist but may have incorrect conditions or consensus format",
      });
    }

  } catch (error) {
    console.error("Minimal OTP fix error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Minimal OTP fix failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to test minimal OTP fix" });
}