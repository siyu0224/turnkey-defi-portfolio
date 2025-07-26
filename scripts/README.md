# Turnkey Sub-Organization Scripts

This directory contains scripts for creating and managing Turnkey sub-organizations.

## Prerequisites

Make sure your `.env.local` file contains:
```
TURNKEY_ORGANIZATION_ID=your-org-id
TURNKEY_API_PUBLIC_KEY=your-public-key
TURNKEY_API_PRIVATE_KEY=your-private-key
```

## Available Scripts

### 1. Create Single Sub-Organization
```bash
node scripts/create-sub-org.js user@example.com
```

This creates a sub-organization with:
- User email as the identifier
- An Ethereum wallet with one address
- No passkeys (added later via frontend)

### 2. Batch Create Multiple Sub-Organizations
```bash
node scripts/batch-create-sub-orgs.js
```

Edit the `users` array in the script to specify multiple users.
Results are saved to `sub-orgs-created.json`.

### 3. Test Your Setup
```bash
node scripts/test-sub-org.js
```

This verifies your environment variables and creates a test sub-org.

## What Gets Created

Each sub-organization includes:
- **Name**: "User: [email]"
- **Root User**: The email address provided
- **Quorum**: 1 (single user can perform all actions)
- **Wallet**: Ethereum wallet with one address
- **Authenticators**: Empty (passkeys added via frontend)

## Sub-Organization Structure

```json
{
  "subOrganizationId": "sub-org-uuid",
  "wallet": {
    "walletId": "wallet-uuid",
    "addresses": ["0x..."]
  }
}
```

## Common Use Cases

### Onboard New Users
```javascript
const { createSubOrganization } = require('./scripts/create-sub-org');

async function onboardUser(email) {
  const result = await createSubOrganization(email);
  // Save result.subOrganizationId to your database
  return result;
}
```

### Pre-create Accounts
Use `batch-create-sub-orgs.js` to pre-create accounts for a list of users.

### Testing
Use `test-sub-org.js` to verify your Turnkey integration is working.

## Important Notes

1. **Rate Limits**: Turnkey may have rate limits. The batch script includes delays.
2. **Passkeys**: These scripts don't add passkeys. Users add them via the frontend.
3. **Security**: Keep your API keys secure. Never commit them to git.
4. **Sub-org IDs**: Save the returned sub-organization IDs in your database.

## Troubleshooting

### "credential ID could not be found"
User is trying to sign in before creating a sub-org. They need to sign up first.

### "Missing environment variables"
Check your `.env.local` file has all required Turnkey credentials.

### "Activity failed"
Check the Turnkey dashboard for more details about the failed activity.