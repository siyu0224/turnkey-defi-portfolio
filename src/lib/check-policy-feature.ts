import { TurnkeyClient } from "@turnkey/http";

export async function checkPolicyFeatureAvailable(
  turnkeyClient: TurnkeyClient,
  organizationId: string
): Promise<boolean> {
  try {
    // Try to get policies - if this succeeds, the feature is available
    await turnkeyClient.getPolicies({
      organizationId: organizationId,
    });
    return true;
  } catch (error: any) {
    console.log("Policy feature check:", error?.message || "Not available");
    return false;
  }
}

export async function tryCreatePolicy(
  turnkeyClient: TurnkeyClient,
  organizationId: string,
  policyParams: any
): Promise<{ success: boolean; policyId?: string; error?: string }> {
  try {
    const response = await turnkeyClient.createPolicy({
      type: "ACTIVITY_TYPE_CREATE_POLICY_V3",
      timestampMs: Date.now().toString(),
      organizationId: organizationId,
      parameters: policyParams,
    });

    return {
      success: true,
      policyId: response.activity.id,
    };
  } catch (error: any) {
    console.error("Policy creation error:", error);
    return {
      success: false,
      error: error?.message || "Failed to create policy",
    };
  }
}