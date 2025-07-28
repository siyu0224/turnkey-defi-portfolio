import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";

export async function POST(request: NextRequest) {
  try {
    const { email, credentialCreationOptions, attestationResponse } = await request.json();
    
    if (!email || !credentialCreationOptions || !attestationResponse) {
      return NextResponse.json(
        { error: "Missing required WebAuthn data" },
        { status: 400 }
      );
    }

    // Use API key stamper for creating sub-organization (server-side operation)
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // First create a sub-organization for the user
    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createSubOrganization,
    });

    console.log('Creating sub-organization for:', email);

    const subOrgActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V7",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        subOrganizationName: `User: ${email}`,
        rootQuorumThreshold: 1,
        rootUsers: [
          {
            userName: email,
            userEmail: email,
            authenticators: [
              {
                authenticatorName: `Passkey for ${email}`,
                challenge: credentialCreationOptions.challenge,
                attestation: {
                  credentialId: attestationResponse.id,
                  clientDataJson: attestationResponse.response.clientDataJSON,
                  attestationObject: attestationResponse.response.attestationObject,
                  transports: (attestationResponse.response.transports || ['internal']).map((t: string) => {
                    // Map WebAuthn transport types to Turnkey transport types
                    const transportMap: Record<string, string> = {
                      'internal': 'AUTHENTICATOR_TRANSPORT_INTERNAL',
                      'usb': 'AUTHENTICATOR_TRANSPORT_USB',
                      'nfc': 'AUTHENTICATOR_TRANSPORT_NFC',
                      'ble': 'AUTHENTICATOR_TRANSPORT_BLE',
                      'hybrid': 'AUTHENTICATOR_TRANSPORT_HYBRID'
                    };
                    return transportMap[t] || 'AUTHENTICATOR_TRANSPORT_INTERNAL';
                  }),
                },
              },
            ],
            apiKeys: [],
            oauthProviders: [],
          },
        ],
        wallet: {
          walletName: "Default Wallet",
          accounts: [
            {
              curve: "CURVE_SECP256K1",
              pathFormat: "PATH_FORMAT_BIP32",
              path: "m/44'/60'/0'/0/0",
              addressFormat: "ADDRESS_FORMAT_ETHEREUM",
            },
          ],
        },
      },
    });

    if (subOrgActivity.status === "ACTIVITY_STATUS_COMPLETED") {
      const result = subOrgActivity.result.createSubOrganizationResultV7;
      
      return NextResponse.json({
        success: true,
        subOrganizationId: result?.subOrganizationId,
        walletId: result?.wallet?.walletId,
        address: result?.wallet?.addresses?.[0],
        authenticatorId: result?.rootUserIds?.[0], // Use the first root user ID
      });
    } else {
      throw new Error(`Sub-organization creation failed: ${subOrgActivity.status}`);
    }

  } catch (error) {
    console.error("Error in Turnkey passkey registration:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to register passkey with Turnkey",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}