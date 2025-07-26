const { createSubOrganization } = require('./create-sub-org');

// List of users to create sub-organizations for
const users = [
  { email: "alice@demo.com", walletName: "Alice's DeFi Wallet" },
  { email: "bob@demo.com", walletName: "Bob's Trading Wallet" },
  { email: "charlie@demo.com", walletName: "Charlie's Portfolio" },
];

async function createMultipleSubOrgs() {
  console.log(`Creating ${users.length} sub-organizations...\n`);
  
  const results = [];
  
  for (const user of users) {
    try {
      console.log(`\n📝 Processing ${user.email}...`);
      const result = await createSubOrganization(user.email, user.walletName);
      results.push({ ...user, ...result, status: 'success' });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed for ${user.email}:`, error.message);
      results.push({ ...user, status: 'failed', error: error.message });
    }
  }
  
  // Summary
  console.log("\n\n📊 SUMMARY:");
  console.log("===========");
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log("\nSuccessful sub-organizations:");
    successful.forEach(r => {
      console.log(`  - ${r.email}: ${r.subOrganizationId}`);
      console.log(`    Wallet: ${r.address}`);
    });
  }
  
  if (failed.length > 0) {
    console.log("\nFailed:");
    failed.forEach(r => {
      console.log(`  - ${r.email}: ${r.error}`);
    });
  }
  
  // Save results to file
  const fs = require('fs');
  fs.writeFileSync(
    'sub-orgs-created.json',
    JSON.stringify(results, null, 2)
  );
  console.log("\n💾 Results saved to sub-orgs-created.json");
}

// Run the batch creation
createMultipleSubOrgs().catch(console.error);