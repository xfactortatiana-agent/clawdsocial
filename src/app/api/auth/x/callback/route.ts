import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

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
    return NextResponse.redirect(new URL(`/dashboard?error=${error}`, request.url))
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
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: 'challenge'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/dashboard?error=token_exchange_failed', request.url))
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

    // Get current user from cookie/session (simplified - using a temp user ID)
    // In production, this should come from your auth system (Clerk)
    const cookieStore = cookies()
    const userId = cookieStore.get('user_id')?.value || 'temp-user-id'

    // Store or update the X connection in database
    await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_accountHandle: {
          workspaceId: 'default-workspace',
          platform: 'X',
          accountHandle: xUser.username
        }
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accountName: xUser.name,
        profileImageUrl: xUser.profile_image_url,
        lastSyncedAt: new Date()
      },
      create: {
        workspaceId: 'default-workspace',
        platform: 'X',
        accountHandle: xUser.username,
        accountName: xUser.name,
        profileImageUrl: xUser.profile_image_url,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isActive: true
      }
    })

    // Redirect back to dashboard with success
    return NextResponse.redirect(new URL(`/dashboard?connected=x&username=${xUser.username}`, request.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', request.url))
  }
}
