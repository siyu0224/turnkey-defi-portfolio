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

    // Get all wallets for the organization
    const response = await turnkeyClient.getWallets({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    console.log(`Found ${response.wallets.length} wallets`);

    // Fetch wallet addresses one by one with error handling
    const walletsWithAddresses = await Promise.all(
      response.wallets.map(async (wallet) => {
        try {
          // Try to get wallet accounts/addresses
          const walletAccounts = await turnkeyClient.getWalletAccounts({
            organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
            walletId: wallet.walletId,
          });

          const accounts = walletAccounts.accounts.map(acc => ({
            address: acc.address || 'No address',
            blockchain: acc.addressFormat === 'ADDRESS_FORMAT_ETHEREUM' ? 'Ethereum' : 
                       acc.addressFormat === 'ADDRESS_FORMAT_BITCOIN' ? 'Bitcoin' : 
                       acc.addressFormat === 'ADDRESS_FORMAT_SOLANA' ? 'Solana' : 'Unknown',
            addressFormat: acc.addressFormat || 'Unknown',
            curveType: acc.curve === 'CURVE_SECP256K1' ? 'secp256k1' : 
                      acc.curve === 'CURVE_ED25519' ? 'ed25519' : 'Unknown',
            path: acc.path,
            pathFormat: acc.pathFormat,
          }));

          return {
            id: wallet.walletId,
            name: wallet.walletName,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
            exported: wallet.exported,
            imported: wallet.imported,
            accounts: accounts.length > 0 ? accounts : [{
              address: 'No accounts',
              blockchain: 'Unknown',
              addressFormat: 'Unknown',
              curveType: 'Unknown'
            }],
            primaryBlockchain: accounts[0]?.blockchain || 'Unknown',
            error: null
          };
        } catch (error) {
          // If individual wallet fails, return with placeholder
          console.warn(`Failed to get accounts for wallet ${wallet.walletId}:`, error);
          return {
            id: wallet.walletId,
            name: wallet.walletName,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
            exported: wallet.exported,
            imported: wallet.imported,
            accounts: [{
              address: 'Error loading address',
              blockchain: 'Unknown',
              addressFormat: 'Unknown',
              curveType: 'Unknown'
            }],
            primaryBlockchain: 'Unknown',
            error: error instanceof Error ? error.message : 'Failed to load accounts'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      wallets: walletsWithAddresses,
      count: walletsWithAddresses.length,
      currentUserId: currentUserId,
      message: `Found ${walletsWithAddresses.length} wallets with addresses`
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