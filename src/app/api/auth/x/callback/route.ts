import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const X_CLIENT_ID = process.env.X_CLIENT_ID
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET

// Hardcode the stable URL
const REDIRECT_URI = 'https://clawdsocial.vercel.app/api/auth/x/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=x_oauth&msg=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url))
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: X_CLIENT_ID || '',
        code_verifier: 'challenge'
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token error:', tokenData)
      return NextResponse.redirect(
        new URL(`/dashboard?error=token_exchange`, request.url)
      )
    }

    // Get user info from X
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    const userData = await userResponse.json()
    const xUser = userData.data

    return NextResponse.redirect(
      new URL(`/dashboard?connected=x&username=${xUser.username}`, request.url)
    )
  } catch (err) {
    console.error('OAuth error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', request.url))
  }
}
