const { TurnkeyClient } = require("@turnkey/http");
const { ApiKeyStamper } = require("@turnkey/api-key-stamper");
const { createActivityPoller } = require("@turnkey/http");

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function createSubOrganization(email, walletName = "Default Wallet") {
  try {
    // Initialize Turnkey client with your API credentials
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: "https://api.turnkey.com",
    }, stamper);

    console.log(`Creating sub-organization for: ${email}`);

    // Create activity poller for async operations
    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createSubOrganization,
    });

    // Create the sub-organization
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
            authenticators: [], // Add passkeys later via frontend
            apiKeys: [],
            oauthProviders: [],
          },
        ],
        // Optional: Create a wallet immediately
        wallet: {
          walletName: walletName,
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
      
      console.log("✅ Sub-organization created successfully!");
      console.log("Sub-org ID:", result.subOrganizationId);
      console.log("Wallet ID:", result.wallet?.walletId);
      console.log("ETH Address:", result.wallet?.addresses?.[0]);
      
      return {
        subOrganizationId: result.subOrganizationId,
        walletId: result.wallet?.walletId,
        address: result.wallet?.addresses?.[0],
      };
    } else {
      throw new Error(`Activity failed with status: ${activity.status}`);
    }

  } catch (error) {
    console.error("❌ Error creating sub-organization:", error);
    throw error;
  }
}

// Example usage
async function main() {
  // Check if email was provided as command line argument
  const email = process.argv[2];
  
  if (!email) {
    console.log("Usage: node scripts/create-sub-org.js <email>");
    console.log("Example: node scripts/create-sub-org.js user@example.com");
    process.exit(1);
  }

  try {
    const result = await createSubOrganization(email);
    console.log("\n🎉 Success! Sub-organization details:", result);
  } catch (error) {
    console.error("\n❌ Failed to create sub-organization");
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createSubOrganization };