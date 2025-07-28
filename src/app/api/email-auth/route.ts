import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";

export async function POST(request: NextRequest) {
  try {
    const { email, step, otpCode, otpId } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Use API key stamper for server-side operations
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    if (step === 'send-otp') {
      // Step 1: Use Turnkey's native INIT_OTP_AUTH to send email OTP
      console.log('Initiating Turnkey OTP auth for email:', email);

      const activityPoller = createActivityPoller({
        client: turnkeyClient,
        requestFn: turnkeyClient.initOtpAuth,
      });

      const initOtpActivity = await activityPoller({
        type: "ACTIVITY_TYPE_INIT_OTP_AUTH_V2",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          otpType: "OTP_TYPE_EMAIL",
          contact: email,
          emailCustomization: {
            appName: "Turnkey Wallet",
          },
        },
      });

      if (initOtpActivity.status === "ACTIVITY_STATUS_COMPLETED") {
        const result = initOtpActivity.result.initOtpAuthResult;
        
        return NextResponse.json({
          success: true,
          message: `Verification code sent to ${email}`,
          otpId: result?.otpId, // Store this for verification
        });
      } else {
        throw new Error(`OTP initialization failed: ${initOtpActivity.status}`);
      }
    } 
    
    else if (step === 'verify-otp') {
      // Step 2: Use Turnkey's native OTP_AUTH to verify the code
      if (!otpCode || !otpId) {
        return NextResponse.json(
          { error: "OTP code and OTP ID are required" },
          { status: 400 }
        );
      }

      console.log('Verifying OTP with Turnkey:', { email, otpId });

      const activityPoller = createActivityPoller({
        client: turnkeyClient,
        requestFn: turnkeyClient.otpAuth,
      });

      const otpAuthActivity = await activityPoller({
        type: "ACTIVITY_TYPE_OTP_AUTH",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          otpId: otpId,
          otpCode: otpCode,
          targetPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!, // Use our API key as target
          apiKeyName: `Session key for ${email}`,
          expirationSeconds: "900", // 15 minutes
        },
      });

      if (otpAuthActivity.status === "ACTIVITY_STATUS_COMPLETED") {
        const result = otpAuthActivity.result.otpAuthResult;
        
        // Now create a sub-organization for the user
        const subOrgResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/create-sub-org`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        let subOrgData = null;
        if (subOrgResponse.ok) {
          subOrgData = await subOrgResponse.json();
        }

        return NextResponse.json({
          success: true,
          message: "Email verified successfully with Turnkey! Account created.",
          user: {
            email: email,
            method: "turnkey-email-otp",
          },
          turnkeyAuth: {
            apiKeyId: result?.apiKeyId,
            credentialBundle: result?.credentialBundle,
          },
          subOrgData: subOrgData,
        });
      } else {
        throw new Error(`OTP verification failed: ${otpAuthActivity.status}`);
      }
    }

    return NextResponse.json(
      { error: "Invalid step parameter" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error in Turnkey email authentication:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Turnkey email authentication failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}