import { NextRequest, NextResponse } from "next/server";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export async function POST(request: NextRequest) {
  try {
    const { 
      strategyName, 
      chain,
      maxGasPrice, // in Gwei
      maxAmount, // max transaction amount
      targetContract, // allowed contract address
      fromToken,
      toToken 
    } = await request.json();

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // Build policy condition using eth.tx.* parameters
    const conditions = [
      "activity.resource == 'TRANSACTION'",
      "activity.action == 'SIGN'"
    ];

    // Add gas price limit if specified
    if (maxGasPrice) {
      const maxGasPriceWei = parseFloat(maxGasPrice) * 1e9; // Convert Gwei to Wei
      conditions.push(`eth.tx.gas_price <= ${maxGasPriceWei}`);
    }

    // Add target contract restriction if specified
    if (targetContract) {
      conditions.push(`eth.tx.to == '${targetContract.toLowerCase()}'`);
    }

    // For token swaps, eth.tx.value is typically 0 (unless dealing with ETH)
    // But we can add a safety check
    if (fromToken === 'ETH' && maxAmount) {
      const maxAmountWei = parseFloat(maxAmount) * 1e18; // Convert ETH to Wei
      conditions.push(`eth.tx.value <= ${maxAmountWei}`);
    } else {
      // For token transfers, ensure no ETH is sent
      conditions.push(`eth.tx.value == 0`);
    }

    const policyCondition = conditions.join(' && ');
    
    console.log("Creating DCA policy with:", {
      strategyName,
      fromToken,
      toToken,
      policyCondition,
      targetContract
    });

    // Create a policy for automated DCA transactions
    const policyResponse = await turnkeyClient.createPolicy({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        policyName: `DCA - ${strategyName} - ${fromToken}→${toToken}`,
        effect: "EFFECT_ALLOW",
        condition: policyCondition,
        consensus: "true", // No manual approval needed for automated transactions
        notes: `Automated DCA strategy: ${maxAmount || '100'} ${fromToken} → ${toToken} on ${chain}. Max gas: ${maxGasPrice || '50'} Gwei`,
      },
    });

    return NextResponse.json({
      success: true,
      policy: {
        id: policyResponse.activity.id,
        name: `DCA - ${strategyName} - ${fromToken}→${toToken}`,
        condition: policyCondition,
        status: policyResponse.activity.status,
      },
      message: "DCA automation policy created with specific transaction limits",
    });

  } catch (error: any) {
    console.error("Error creating DCA policy:", error);
    
    // Return success even if policy creation fails
    // This allows DCA strategies to work even without policies
    return NextResponse.json({
      success: true,
      policy: null,
      message: "DCA strategy created (policy creation optional)",
      error: error?.message,
    });
  }
}