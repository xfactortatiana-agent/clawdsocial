import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const X_CLIENT_ID = process.env.X_CLIENT_ID
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET
const REDIRECT_URI = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/auth/x/callback`
  : 'http://localhost:3000/api/auth/x/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`/dashboard?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect('/dashboard?error=no_code')
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: 'challenge' // PKCE verifier
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect('/dashboard?error=token_exchange_failed')
    }

    const tokens = await tokenResponse.json()

    // Get user info from X
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    })

    const userData = await userResponse.json()
    const xUser = userData.data

    // Store in database (simplified - in production, link to logged-in user)
    // For now, we'll just redirect with success
    
    return NextResponse.redirect(`/dashboard?connected=x&username=${xUser.username}`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect('/dashboard?error=oauth_failed')
  }
}
