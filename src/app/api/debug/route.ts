import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasOrgId: !!process.env.NEXT_PUBLIC_ORGANIZATION_ID,
    orgIdStart: process.env.NEXT_PUBLIC_ORGANIZATION_ID?.slice(0, 8) || 'missing',
    hasPublicKey: !!process.env.TURNKEY_API_PUBLIC_KEY,
    publicKeyStart: process.env.TURNKEY_API_PUBLIC_KEY?.slice(0, 8) || 'missing',
    hasPrivateKey: !!process.env.TURNKEY_API_PRIVATE_KEY,
    privateKeyStart: process.env.TURNKEY_API_PRIVATE_KEY?.slice(0, 8) || 'missing',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'missing'
  });
}