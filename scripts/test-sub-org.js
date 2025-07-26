// Quick test to create a sub-org
require('dotenv').config({ path: '.env.local' });

// Check environment variables
console.log("🔍 Checking environment variables...");
console.log("Organization ID:", process.env.TURNKEY_ORGANIZATION_ID ? "✅ Set" : "❌ Missing");
console.log("API Public Key:", process.env.TURNKEY_API_PUBLIC_KEY ? "✅ Set" : "❌ Missing");
console.log("API Private Key:", process.env.TURNKEY_API_PRIVATE_KEY ? "✅ Set" : "❌ Missing");

if (!process.env.TURNKEY_ORGANIZATION_ID || !process.env.TURNKEY_API_PUBLIC_KEY || !process.env.TURNKEY_API_PRIVATE_KEY) {
  console.error("\n❌ Missing required environment variables!");
  console.log("\nMake sure your .env.local file contains:");
  console.log("  TURNKEY_ORGANIZATION_ID=xxx");
  console.log("  TURNKEY_API_PUBLIC_KEY=xxx");
  console.log("  TURNKEY_API_PRIVATE_KEY=xxx");
  process.exit(1);
}

// Test creating a sub-org
const { createSubOrganization } = require('./create-sub-org');

async function test() {
  const testEmail = `test-${Date.now()}@example.com`;
  console.log(`\n🧪 Testing sub-org creation with: ${testEmail}`);
  
  try {
    const result = await createSubOrganization(testEmail);
    console.log("\n✅ Test successful!");
    console.log("You can now use this sub-org ID:", result.subOrganizationId);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
  }
}

test();