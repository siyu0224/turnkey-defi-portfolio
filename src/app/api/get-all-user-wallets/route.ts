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

    // Get current user info
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    const currentUserId = whoamiResponse.userId;
    console.log('Current user ID:', currentUserId);

    // Get ALL wallets for the organization
    const response = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    console.log(`Found ${response.wallets.length} total wallets in organization`);

    // Get wallet details for each wallet
    const walletsWithDetails = await Promise.all(
      response.wallets.map(async (wallet) => {
        try {
          const walletDetails = await turnkeyClient.getWallet({
            organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
            walletId: wallet.walletId,
          });

          // Get the wallet's metadata to find creator
          const walletData = walletDetails.wallet as any;
          const accounts = walletData.accounts || [];
          
          // Enhanced account details
          const enhancedAccounts = accounts.map((account: any) => ({
            address: account.address,
            addressFormat: account.addressFormat,
            curve: account.curve,
            path: account.path,
            pathFormat: account.pathFormat,
            publicKey: account.publicKey,
            blockchain: account.addressFormat === 'ADDRESS_FORMAT_ETHEREUM' ? 'Ethereum' :
                       account.addressFormat === 'ADDRESS_FORMAT_BITCOIN' ? 'Bitcoin' :
                       account.addressFormat === 'ADDRESS_FORMAT_SOLANA' ? 'Solana' :
                       'Unknown',
            curveType: account.curve === 'CURVE_SECP256K1' ? 'secp256k1' :
                      account.curve === 'CURVE_ED25519' ? 'ed25519' :
                      'Unknown'
          }));

          return {
            id: wallet.walletId,
            name: wallet.walletName,
            accounts: enhancedAccounts,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
            exported: wallet.exported,
            imported: wallet.imported,
            primaryBlockchain: enhancedAccounts[0]?.blockchain || 'Unknown',
            // Add any available metadata
            metadata: walletData,
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

    // For now, return all wallets since we can't determine the creator from the API
    // In a production app, you would store this relationship in a database
    return NextResponse.json({
      success: true,
      currentUserId: currentUserId,
      totalWallets: walletsWithDetails.length,
      wallets: walletsWithDetails,
      message: `Found ${walletsWithDetails.length} wallets in the organization`,
      note: "Showing all organization wallets. In production, implement proper user-wallet association."
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