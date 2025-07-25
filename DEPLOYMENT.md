# 🚀 Production Deployment Guide

## Prerequisites

1. **HTTPS Domain Required** - Passkeys only work on HTTPS domains
2. **Turnkey Production Credentials** - Get from Turnkey dashboard
3. **Deployment Platform Account** (Vercel, Netlify, etc.)

## Option 1: Deploy to Vercel (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Configure Environment Variables
In your Vercel dashboard or via CLI:

```bash
# Set production environment variables
vercel env add NEXT_PUBLIC_ORGANIZATION_ID production
vercel env add TURNKEY_API_PUBLIC_KEY production  
vercel env add TURNKEY_API_PRIVATE_KEY production
vercel env add NEXT_PUBLIC_BASE_URL production
```

### Step 4: Deploy
```bash
vercel --prod
```

## Option 2: Deploy to Netlify

### Step 1: Build for production
```bash
npm run build
npm run export  # if using static export
```

### Step 2: Deploy to Netlify
- Connect your GitHub repo to Netlify
- Set environment variables in Netlify dashboard
- Deploy automatically on git push

## Option 3: Deploy to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login and deploy
```bash
railway login
railway init
railway add  # Add environment variables
railway up
```

## Option 4: Deploy to AWS/DigitalOcean

### Using Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables Setup

### Required Variables:
- `NEXT_PUBLIC_ORGANIZATION_ID` - Your Turnkey organization ID
- `TURNKEY_API_PUBLIC_KEY` - Your Turnkey API public key
- `TURNKEY_API_PRIVATE_KEY` - Your Turnkey API private key (keep secret!)
- `NEXT_PUBLIC_BASE_URL` - https://api.turnkey.com

### Optional Variables:
- `NEXT_PUBLIC_APP_URL` - Your production domain
- `NODE_ENV` - production

## Security Considerations

1. **Never commit `.env` files** with real credentials
2. **Use environment variable injection** in your deployment platform
3. **Enable HTTPS** for passkey functionality
4. **Set up proper CORS** if needed
5. **Use Turnkey's production endpoints**

## Turnkey Production Setup

1. **Create Production Organization** in Turnkey dashboard
2. **Generate Production API Keys**
3. **Configure OAuth URLs** (if using Google auth)
4. **Set up webhook endpoints** (if needed)
5. **Test with production credentials**

## Domain and HTTPS Setup

### For Passkeys to work, you need:
1. **Custom domain** (not .vercel.app)
2. **Valid SSL certificate** (automatic with most platforms)
3. **Update Turnkey settings** with your production domain

## Testing Production Deployment

1. **Verify HTTPS** - Check SSL certificate
2. **Test Passkey auth** - Should prompt for biometrics
3. **Test wallet creation** - Should use production Turnkey org
4. **Check all API endpoints** - Ensure they're working
5. **Test mobile devices** - Verify responsive design

## Performance Optimization

1. **Enable compression** (gzip/brotli)
2. **Set up CDN** for static assets
3. **Optimize images** and fonts
4. **Enable caching** headers
5. **Monitor performance** with tools like Lighthouse

## Monitoring and Analytics

Consider adding:
- **Error tracking** (Sentry)
- **Analytics** (Google Analytics, Mixpanel)
- **Performance monitoring** (New Relic, DataDog)
- **Uptime monitoring** (Pingdom, UptimeRobot)

## Common Issues and Solutions

### Passkeys not working:
- Ensure HTTPS is enabled
- Check browser compatibility
- Verify domain configuration

### Turnkey API errors:
- Verify production credentials
- Check organization ID
- Ensure proper network access

### Build failures:
- Check environment variables
- Verify dependencies
- Review build logs