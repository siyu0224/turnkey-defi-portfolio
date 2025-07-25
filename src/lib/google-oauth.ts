// Google OAuth Configuration
// To make this work with real Google OAuth, you need to:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing one
// 3. Enable Google+ API
// 4. Create OAuth 2.0 credentials
// 5. Add your domain to authorized origins
// 6. Replace the DEMO_CLIENT_ID with your real client ID

export const GOOGLE_OAUTH_CONFIG = {
  // DEMO CLIENT ID - Replace with your real Google OAuth Client ID
  CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "DEMO_CLIENT_ID_123456789",
  
  // OAuth scopes - what information we want from Google
  SCOPES: [
    'openid',
    'profile', 
    'email'
  ],
  
  // Redirect URI (must be configured in Google Console)
  REDIRECT_URI: process.env.NEXT_PUBLIC_APP_URL ? 
    `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` : 
    'http://localhost:3000/auth/callback'
};

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

// For demo purposes, we'll simulate a successful Google OAuth response
export const DEMO_GOOGLE_USER: GoogleUser = {
  id: 'google_demo_user_123',
  email: 'demo@gmail.com',
  name: 'Demo User',
  picture: 'https://via.placeholder.com/96x96/4285F4/ffffff?text=GU',
  verified_email: true
};