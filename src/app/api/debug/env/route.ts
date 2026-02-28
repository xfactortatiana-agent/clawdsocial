import { NextResponse } from 'next/server'

export async function GET() {
  const debug = {
    vercelUrl: process.env.VERCEL_URL,
    hasClientId: !!process.env.X_CLIENT_ID,
    hasClientSecret: !!process.env.X_CLIENT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    redirectUri: process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/auth/x/callback`
      : 'http://localhost:3000/api/auth/x/callback'
  }
  
  return NextResponse.json(debug)
}
