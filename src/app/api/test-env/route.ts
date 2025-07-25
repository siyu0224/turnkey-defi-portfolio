import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasOrgId: !!process.env.NEXT_PUBLIC_ORGANIZATION_ID,
    hasPublicKey: !!process.env.TURNKEY_API_PUBLIC_KEY,
    hasPrivateKey: !!process.env.TURNKEY_API_PRIVATE_KEY,
    hasBaseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
    orgId: process.env.NEXT_PUBLIC_ORGANIZATION_ID ? 
           process.env.NEXT_PUBLIC_ORGANIZATION_ID.slice(0, 8) + '...' : 
           'missing',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'missing'
  });
}