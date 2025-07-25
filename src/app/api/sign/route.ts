import { NextRequest, NextResponse } from "next/server";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { TurnkeyClient } from "@turnkey/http";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    });

    const turnkeyClient = new TurnkeyClient({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://api.turnkey.com",
    }, stamper);

    // This is a simple passthrough for the stamper functionality
    const response = await stamper.stamp(body);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in sign API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}