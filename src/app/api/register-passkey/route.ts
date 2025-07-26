import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";

export async function POST(request: NextRequest) {
  try {
    const { email, subOrganizationId, attestationObject, clientDataJSON, credentialId, userId } = await request.json();
    
    if (!email || !subOrganizationId || !attestationObject || !clientDataJSON || !credentialId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Turnkey client
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Create activity poller
    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createAuthenticators,
    });

    // Register the passkey with Turnkey
    const activity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_AUTHENTICATORS_V2",
      timestampMs: Date.now().toString(),
      organizationId: subOrganizationId, // Use the sub-org ID
      parameters: {
        userId: userId || email, // Use userId or fallback to email
        authenticators: [
          {
            authenticatorName: `Passkey for ${email}`,
            challenge: Buffer.from(clientDataJSON, 'base64').toString('hex'),
            attestation: {
              credentialId: credentialId,
              clientDataJson: clientDataJSON,
              attestationObject: attestationObject,
              transports: ["AUTHENTICATOR_TRANSPORT_HYBRID", "AUTHENTICATOR_TRANSPORT_INTERNAL"],
            },
          },
        ],
      },
    });

    if (activity.status === "ACTIVITY_STATUS_COMPLETED") {
      return NextResponse.json({
        success: true,
        authenticatorId: activity.result.createAuthenticatorsResult?.authenticatorIds?.[0],
      });
    } else {
      throw new Error(`Activity failed with status: ${activity.status}`);
    }

  } catch (error) {
    console.error("Error registering passkey:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register passkey" },
      { status: 500 }
    );
  }
}