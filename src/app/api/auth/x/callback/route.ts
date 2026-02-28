import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const X_CLIENT_ID = process.env.X_CLIENT_ID
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET
const REDIRECT_URI = 'https://clawdsocial.vercel.app/api/auth/x/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  console.log('=== X OAUTH CALLBACK ===')
  console.log('Code:', code ? 'present' : 'missing')
  console.log('State:', state)
  console.log('Error:', error)

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=x_oauth&msg=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code', request.url))
  }

  try {
    // Step 1: Exchange code for access token
    console.log('Exchanging code for token...')
    
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
    console.log('Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      console.error('Token error:', tokenData)
      return NextResponse.redirect(
        new URL(`/settings?error=token_exchange&details=${encodeURIComponent(JSON.stringify(tokenData))}`, request.url)
      )
    }

    // Step 2: Get user info from X
    console.log('Getting user info from X...')
    
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userResponse.ok) {
      const userError = await userResponse.text()
      console.error('User info error:', userResponse.status, userError)
      return NextResponse.redirect(new URL('/settings?error=user_info_failed', request.url))
    }

    const userData = await userResponse.json()
    console.log('X user data:', JSON.stringify(userData))
    
    const xUser = userData.data

    if (!xUser || !xUser.username) {
      console.error('No username in response')
      return NextResponse.redirect(new URL('/settings?error=no_username', request.url))
    }

    // Step 3: Get user from cookie or create temp user
    // For now, we'll use a temporary approach - store in cookie and let client save
    console.log('Success! Redirecting with user data...')

    return NextResponse.redirect(
      new URL(`/settings?connected=x&username=${encodeURIComponent(xUser.username)}&name=${encodeURIComponent(xUser.name || '')}&pfp=${encodeURIComponent(xUser.profile_image_url || '')}&token=${encodeURIComponent(tokenData.access_token)}`, request.url)
    )
  } catch (err) {
    console.error('OAuth exception:', err)
    return NextResponse.redirect(new URL('/settings?error=exception', request.url))
  }
}
