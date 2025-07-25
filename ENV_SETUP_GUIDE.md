# 🔐 Environment Variables Setup Guide

## Quick Start (Minimum Required Setup)

You only need **4 required values** from Turnkey to get started!

### Step 1: Get Your Turnkey Credentials

1. **Go to** [app.turnkey.com](https://app.turnkey.com)
2. **Sign in** to your account
3. **Navigate to:**
   - **API Keys** section → Copy your API keys
   - **Organization** settings → Copy your Organization ID

### Step 2: Fill in Required Values

Open `.env.local` and replace these 4 values:

```env
# Lines 4-6: Replace these with your actual values
TURNKEY_API_PRIVATE_KEY=your_actual_private_key_here
TURNKEY_API_PUBLIC_KEY=your_actual_public_key_here  
TURNKEY_ORGANIZATION_ID=your_actual_org_id_here

# Line 11: Same organization ID as above
NEXT_PUBLIC_ORGANIZATION_ID=your_actual_org_id_here
```

### Step 3: Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and you should be able to:
- ✅ Sign in with **Passkey**
- ✅ Sign in with **Email** (OTP)
- ✅ Sign in with **Phone/SMS** (OTP)
- ✅ Create wallets
- ✅ Sign messages

---

## Optional: Enable OAuth Providers

Want Google, Apple, or other OAuth logins? Here's how:

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project → Enable Google+ API
3. Create OAuth 2.0 Client ID
4. Add `http://localhost:3000` to authorized origins
5. Uncomment and add to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

### Other OAuth Providers
- **Apple**: [developer.apple.com](https://developer.apple.com)
- **Facebook**: [developers.facebook.com](https://developers.facebook.com)
- **GitHub**: [github.com/settings/developers](https://github.com/settings/developers)
- **Microsoft**: [azure.microsoft.com](https://azure.microsoft.com)

Just uncomment the lines for providers you want and add their client IDs!

---

## What Works Out of the Box?

With just the 4 required Turnkey values, you get:

| Feature | Status | No Extra Setup Needed |
|---------|--------|---------------------|
| Passkey Authentication | ✅ | Works immediately |
| Email OTP | ✅ | Turnkey handles email sending |
| SMS OTP | ✅ | Turnkey handles SMS sending |
| Account Recovery | ✅ | Via email or phone |
| Wallet Creation | ✅ | HSM-secured wallets |
| Message Signing | ✅ | All DeFi scenarios |
| Session Management | ✅ | 1-hour secure sessions |

---

## For Production Deployment

When deploying to Vercel, update these in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_DOMAIN=your-app.vercel.app
NEXT_PUBLIC_OAUTH_REDIRECT_URI=https://your-app.vercel.app/auth/callback
```

Then add all environment variables to your Vercel project settings.

---

## Need Help?

- **Turnkey Docs**: [docs.turnkey.com](https://docs.turnkey.com)
- **OAuth Provider Guides**: Check each provider's developer docs
- **Issues**: Check the console for detailed error messages

Remember: You only need the 4 Turnkey values to start. Everything else is optional!