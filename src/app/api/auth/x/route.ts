import { NextResponse } from 'next/server'

const X_CLIENT_ID = process.env.X_CLIENT_ID

const getRedirectUri = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/auth/x/callback`
  }
  return 'http://localhost:3000/api/auth/x/callback'
}

export async function GET() {
  console.log('Starting X OAuth flow...')
  console.log('VERCEL_URL:', process.env.VERCEL_URL)
  console.log('CLIENT_ID exists:', !!X_CLIENT_ID)

  if (!X_CLIENT_ID) {
    return NextResponse.json(
      { error: 'X_CLIENT_ID not configured' },
      { status: 500 }
    )
  }

  const redirectUri = getRedirectUri()
  console.log('Redirect URI:', redirectUri)

  // Generate random state for security
  const state = Buffer.from(Math.random().toString()).toString('base64').slice(0, 32)
  
  // X OAuth 2.0 authorization URL
  const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', X_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', 'challenge')
  authUrl.searchParams.set('code_challenge_method', 'plain')

  console.log('Auth URL:', authUrl.toString().slice(0, 100) + '...')

  // Store state in cookie for verification
  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600
  })

  return response
}
