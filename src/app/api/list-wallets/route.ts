import { NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { getWalletsByUserId, initializeDemoMappings } from "@/lib/wallet-user-mapping";

// Initialize mappings on module load
initializeDemoMappings();

export async function POST() {
  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Get current user info to filter wallets
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    const currentUserId = whoamiResponse.userId;
    console.log('Current user ID:', currentUserId);

    // Get all wallets for the organization
    const response = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    // Get wallet details for each wallet and filter by current user
    const allWalletsWithDetails = await Promise.all(
      response.wallets.map(async (wallet) => {
        try {
          const walletDetails = await turnkeyClient.getWallet({
            organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
            walletId: wallet.walletId,
          });

          const accounts = (walletDetails.wallet as { accounts?: unknown[] })?.accounts || [];
          
          // Enhanced account details with blockchain type
          const enhancedAccounts = accounts.map((account) => {
            const acc = account as { address?: string; addressFormat?: string; curve?: string; path?: string; pathFormat?: string; publicKey?: string };
            return {
            address: acc.address,
            addressFormat: acc.addressFormat,
            curve: acc.curve,
            path: acc.path,
            pathFormat: acc.pathFormat,
            publicKey: acc.publicKey,
            // Determine blockchain type from address format
            blockchain: acc.addressFormat === 'ADDRESS_FORMAT_ETHEREUM' ? 'Ethereum' :
                       acc.addressFormat === 'ADDRESS_FORMAT_BITCOIN' ? 'Bitcoin' :
                       acc.addressFormat === 'ADDRESS_FORMAT_SOLANA' ? 'Solana' :
                       acc.addressFormat || 'Unknown',
            // Friendly curve name
            curveType: acc.curve === 'CURVE_SECP256K1' ? 'secp256k1' :
                      acc.curve === 'CURVE_ED25519' ? 'ed25519' :
                      acc.curve || 'Unknown'
            };
          });

          return {
            id: wallet.walletId,
            name: wallet.walletName,
            accounts: enhancedAccounts,
            createdAt: wallet.createdAt,
            exported: wallet.exported,
            imported: wallet.imported,
            // Get the primary blockchain from first account
            primaryBlockchain: enhancedAccounts[0]?.blockchain || 'Unknown',
            // Include raw wallet data for debugging
            rawWallet: walletDetails.wallet,
          };
        } catch (error) {
          console.warn(`Failed to get details for wallet ${wallet.walletId}:`, error);
          return {
            id: wallet.walletId,
            name: wallet.walletName,
            accounts: [],
            createdAt: wallet.createdAt,
            error: 'Failed to load wallet details',
            primaryBlockchain: 'Unknown',
          };
        }
      })
    );

    // Get wallets created by current user
    const userWalletIds = getWalletsByUserId(currentUserId);
    console.log(`User ${currentUserId} has ${userWalletIds.length} tracked wallets`);
    
    // Filter wallets to only show ones created by current user
    // If no tracked wallets, show none (instead of all)
    const userWallets = userWalletIds.length > 0 
      ? allWalletsWithDetails.filter(wallet => userWalletIds.includes(wallet.id))
      : [];

    return NextResponse.json({
      success: true,
      wallets: userWallets,
      count: userWallets.length,
      currentUserId: currentUserId,
    });

  } catch (error) {
    console.error("Error listing wallets:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list wallets",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to list wallets" });
}