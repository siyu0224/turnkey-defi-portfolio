import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";
import { addWalletOwnership } from "@/lib/wallet-storage";
import { createWalletPolicies } from "@/lib/create-wallet-policies";

// Turnkey blockchain constants
const BLOCKCHAIN_MAPPING = {
  ethereum: "BLOCKCHAIN_ETHEREUM",
  polygon: "BLOCKCHAIN_POLYGON", 
  arbitrum: "BLOCKCHAIN_ARBITRUM",
  optimism: "BLOCKCHAIN_OPTIMISM",
  base: "BLOCKCHAIN_BASE",
} as const;

export async function POST(request: NextRequest) {
  try {
    const { walletName, chains } = await request.json();

    if (!walletName || typeof walletName !== 'string') {
      return NextResponse.json(
        { error: "Wallet name is required and must be a string" },
        { status: 400 }
      );
    }

    if (!chains || !Array.isArray(chains) || chains.length === 0) {
      return NextResponse.json(
        { error: "At least one chain must be selected" },
        { status: 400 }
      );
    }

    console.log("Creating multi-chain wallet:", walletName, "for chains:", chains);

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Get current user ID
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
    const currentUserId = whoamiResponse.userId;

    // Create a single account that works across all EVM chains
    // EVM chains share the same address format
    const accounts = [{
      curve: "CURVE_SECP256K1" as const,
      pathFormat: "PATH_FORMAT_BIP32" as const,
      path: "m/44'/60'/0'/0/0", // Standard Ethereum derivation path
      addressFormat: "ADDRESS_FORMAT_ETHEREUM" as const,
    }];

    // Use activity poller to ensure wallet creation completes
    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createWallet,
    });

    const activity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_WALLET",
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        walletName,
        accounts,
      },
      timestampMs: Date.now().toString(),
    });

    if (activity.status === "ACTIVITY_STATUS_COMPLETED") {
      const walletId = activity.result?.createWalletResult?.walletId;
      const addresses = activity.result?.createWalletResult?.addresses;

      // Track wallet-user association with chains
      if (walletId) {
        addWalletOwnership(walletId, currentUserId, chains);
      }

      // Get wallet details with accounts
      const walletDetails = await turnkeyClient.getWalletAccounts({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        walletId: walletId!,
      });

      // Create policies for the new wallet
      try {
        const policyResult = await createWalletPolicies(
          turnkeyClient,
          process.env.TURNKEY_ORGANIZATION_ID!,
          walletId!,
          walletName,
          chains
        );
        console.log("Policy creation result:", policyResult);
        
        if (policyResult.success) {
          console.log(`Created ${policyResult.totalCreated} policies for wallet ${walletName}`);
        }
        
        if (policyResult.errors) {
          console.error("Some policies failed to create:", policyResult.errors);
        }
      } catch (policyError) {
        console.error("Error creating policies for wallet:", policyError);
        // Continue even if policy creation fails
      }

      return NextResponse.json({
        success: true,
        wallet: {
          id: walletId,
          name: walletName,
          addresses: addresses,
          accounts: walletDetails.accounts,
          chains: chains,
          primaryBlockchain: chains[0], // First selected chain is primary
          createdAt: new Date().toISOString(),
          userId: currentUserId,
        },
        message: `Multi-chain wallet "${walletName}" created successfully!`,
      });
    } else {
      throw new Error(`Wallet creation failed with status: ${activity.status}`);
    }

  } catch (error) {
    console.error("Error creating multi-chain wallet:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create multi-chain wallet",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}