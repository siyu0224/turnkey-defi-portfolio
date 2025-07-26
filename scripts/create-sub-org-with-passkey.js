const { TurnkeyClient } = require("@turnkey/http");
const { ApiKeyStamper } = require("@turnkey/api-key-stamper");
const { createActivityPoller } = require("@turnkey/http");

require('dotenv').config({ path: '.env.local' });

async function createSubOrgWithPasskey(email, passkeyName, publicKeyCredentialId, publicKey) {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: "https://api.turnkey.com",
    }, stamper);

    console.log(`Creating sub-organization with passkey for: ${email}`);

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createSubOrganization,
    });

    const activity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V7",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID,
      parameters: {
        subOrganizationName: `User: ${email}`,
        rootQuorumThreshold: 1,
        rootUsers: [
          {
            userName: email,
            userEmail: email,
            authenticators: [
              {
                authenticatorName: passkeyName,
                challenge: Buffer.from(new Date().toString()).toString('hex'),
                attestation: {
                  credentialId: publicKeyCredentialId,
                  clientDataJson: "{}",
                  attestationObject: "{}",
                  transports: ["AUTHENTICATOR_TRANSPORT_HYBRID"],
                },
              },
            ],
            apiKeys: [],
            oauthProviders: [],
          },
        ],
        wallet: {
          walletName: "Primary Wallet",
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

    if (activity.status === "ACTIVITY_STATUS_COMPLETED") {
      const result = activity.result.createSubOrganizationResultV7;
      
      console.log("✅ Sub-organization with passkey created!");
      console.log("Sub-org ID:", result.subOrganizationId);
      console.log("Wallet Address:", result.wallet?.addresses?.[0]);
      
      return result;
    }

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Note: In a real scenario, you would get passkey data from WebAuthn API
// This is just an example structure
const exampleUsage = async () => {
  await createSubOrgWithPasskey(
    "user@example.com",
    "MacBook Pro Touch ID",
    "example-credential-id",
    "example-public-key"
  );
};

module.exports = { createSubOrgWithPasskey };