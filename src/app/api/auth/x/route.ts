import { NextResponse } from 'next/server'

// X OAuth 2.0 Configuration
const X_CLIENT_ID = process.env.X_CLIENT_ID
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET
const REDIRECT_URI = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/auth/x/callback`
  : 'http://localhost:3000/api/auth/x/callback'

// Step 1: Initiate OAuth flow
export async function GET() {
  if (!X_CLIENT_ID) {
    return NextResponse.json(
      { error: 'X_CLIENT_ID not configured' },
      { status: 500 }
    )
  }

  // Generate random state for security
  const state = Buffer.from(Math.random().toString()).toString('base64').slice(0, 32)
  
  // X OAuth 2.0 authorization URL
  const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', X_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', 'challenge') // PKCE - simplified for now
  authUrl.searchParams.set('code_challenge_method', 'plain')

  // Store state in cookie for verification
  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600 // 10 minutes
  })

  return response
}
