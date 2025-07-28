import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { createActivityPoller } from "@turnkey/http";

export async function POST(request: NextRequest) {
  try {
    const { 
      walletId, 
      transactionType,
      transactionParams,
      policyId 
    } = await request.json();

    if (!walletId || !transactionType || !transactionParams) {
      return NextResponse.json(
        { error: "Wallet ID, transaction type, and parameters are required" },
        { status: 400 }
      );
    }

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Example: Execute a transaction with policy enforcement
    // In a real implementation, Turnkey would evaluate the policy before signing
    
    let activity;
    
    if (transactionType === 'eth_transfer') {
      // Create and sign an Ethereum transaction
      const activityPoller = createActivityPoller({
        client: turnkeyClient,
        requestFn: turnkeyClient.signTransaction,
      });

      // For demo purposes, we'll simulate the transaction
      // In production, you'd construct the proper RLP-encoded transaction
      const unsignedTx = JSON.stringify({
        to: transactionParams.to,
        value: transactionParams.value,
        data: transactionParams.data || "0x",
        nonce: transactionParams.nonce || "0",
        gasLimit: transactionParams.gasLimit || "21000",
        gasPrice: transactionParams.gasPrice,
        chainId: transactionParams.chainId || "1",
      });

      activity = await activityPoller({
        type: "ACTIVITY_TYPE_SIGN_TRANSACTION_V2",
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        parameters: {
          signWith: walletId,
          type: "TRANSACTION_TYPE_ETHEREUM",
          unsignedTransaction: unsignedTx,
        },
        timestampMs: Date.now().toString(),
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported transaction type" },
        { status: 400 }
      );
    }

    if (activity.status === "ACTIVITY_STATUS_COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "Transaction executed successfully with policy enforcement",
        transaction: {
          id: activity.id,
          status: activity.status,
          signature: activity.result?.signTransactionResult?.signedTransaction,
          evaluatedPolicies: policyId ? [policyId] : [],
          timestamp: new Date().toISOString(),
        },
      });
    } else if (activity.status === "ACTIVITY_STATUS_FAILED") {
      // Check if it failed due to policy evaluation
      const failureMessage = activity.failure?.message || "Transaction failed";
      const isPolicyFailure = failureMessage.toLowerCase().includes("policy");
      
      return NextResponse.json({
        success: false,
        error: failureMessage,
        policyViolation: isPolicyFailure,
        details: {
          activityId: activity.id,
          status: activity.status,
          policyId: policyId,
        }
      }, { status: 400 });
    } else {
      throw new Error(`Transaction failed with status: ${activity.status}`);
    }

  } catch (error) {
    console.error("Error executing transaction with policy:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to execute transaction",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}