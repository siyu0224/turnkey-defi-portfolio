import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { message, address, walletId, chain } = await request.json();

    console.log("Signing message:", message);
    console.log("With address:", address);
    console.log("Wallet ID:", walletId);
    console.log("Chain:", chain || "ethereum");

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // First, get the actual wallet accounts to find the real address
    console.log("Getting wallet accounts for signing...");
    const accountsResponse = await turnkeyClient.getWalletAccounts({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      walletId: walletId,
    });

    if (!accountsResponse.accounts || accountsResponse.accounts.length === 0) {
      throw new Error("No accounts found for this wallet");
    }

    // Use the first account's address for signing
    const signingAddress = accountsResponse.accounts[0].address;
    console.log("Using actual address for signing:", signingAddress);

    // Convert message to hex payload
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    const payload = Array.from(messageBytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Sign with the actual address
    const response = await turnkeyClient.signRawPayload({
      type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2",
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        signWith: signingAddress,  // Use the actual address
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