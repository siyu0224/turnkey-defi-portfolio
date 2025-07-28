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

    console.log('Listing organization features...');

    // Get organization details to see available features
    const orgResponse = await turnkeyClient.getOrganization({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    // Try to get current user info
    const whoamiResponse = await turnkeyClient.getWhoami({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    // Get activities to see what features have been used
    const activitiesResponse = await turnkeyClient.getActivities({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      paginationOptions: { limit: "20" },
    });

    // Look for feature-related activities
    const featureActivities = activitiesResponse.activities.filter(a => 
      a.type.includes('FEATURE') || 
      a.type.includes('OTP') || 
      a.type.includes('EMAIL')
    );

    return NextResponse.json({
      success: true,
      organization: {
        id: orgResponse.organizationData?.organizationId,
        name: orgResponse.organizationData?.name,
        // Check if there are any feature flags in the org data
        fullData: orgResponse.organizationData,
      },
      featureActivities: featureActivities.map(a => ({
        type: a.type,
        status: a.status,
        parameters: a.result,
      })),
      suggestion: "Check the fullData object for any feature-related fields",
    });

  } catch (error) {
    console.error("List features error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to list features",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to list organization features" });
}