import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { message, address, walletId } = await request.json();

    console.log("Signing message:", message);
    console.log("With address:", address);
    console.log("Wallet ID:", walletId);

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // First get the wallet accounts to find the correct signWith ID
    const walletAccountsResponse = await turnkeyClient.getWalletAccounts({
      organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
      walletId: walletId,
    });

    const account = walletAccountsResponse.accounts.find(acc => acc.address === address);
    if (!account) {
      throw new Error(`No account found for address ${address}`);
    }

    console.log("Using wallet account ID:", account.walletAccountId);

    // Convert message to hex payload
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    const payload = Array.from(messageBytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // For wallet accounts, we need to sign using the address, not privateKeyId
    const response = await turnkeyClient.signRawPayload({
      type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2",
      organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
      parameters: {
        signWith: address,  // Use the address for wallet-based signing
        payload,
        encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
        hashFunction: "HASH_FUNCTION_KECCAK256",
      },
      timestampMs: Date.now().toString(),
    });

    const signResult = response.activity?.result?.signRawPayloadResult;
    let signature = 'unknown';
    
    if (signResult && signResult.r && signResult.s && signResult.v) {
      signature = `${signResult.r}${signResult.s.slice(2)}${signResult.v.slice(2)}`;
    }

    return NextResponse.json({ 
      success: true, 
      signature
    });
  } catch (error) {
    console.error("Error signing message:", error);
    return NextResponse.json(
      { 
        error: "Failed to sign message",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}