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

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=x_oauth&msg=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code', request.url))
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
        new URL(`/settings?error=token_exchange`, request.url)
      )
    }

    // Get user info from X
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/settings?error=user_info_failed', request.url))
    }

    const userData = await userResponse.json()
    const xUser = userData.data

    if (!xUser || !xUser.username) {
      return NextResponse.redirect(new URL('/settings?error=no_username', request.url))
    }

    // Create default workspace if it doesn't exist
    await prisma.workspace.upsert({
      where: { id: 'default-workspace' },
      update: {},
      create: {
        id: 'default-workspace',
        name: 'Default Workspace',
        slug: 'default',
        ownerId: 'temp-user-id'
      }
    })

    // Save to database
    await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_accountHandle: {
          workspaceId: 'default-workspace',
          platform: 'X',
          accountHandle: xUser.username
        }
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accountName: xUser.name || xUser.username,
        profileImageUrl: xUser.profile_image_url,
        lastSyncedAt: new Date(),
        isActive: true
      },
      create: {
        workspaceId: 'default-workspace',
        platform: 'X',
        accountHandle: xUser.username,
        accountName: xUser.name || xUser.username,
        profileImageUrl: xUser.profile_image_url,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        isActive: true
      }
    })

    return NextResponse.redirect(
      new URL(`/settings?connected=x&username=${encodeURIComponent(xUser.username)}`, request.url)
    )
  } catch (err) {
    console.error('OAuth error:', err)
    return NextResponse.redirect(new URL('/settings?error=exception', request.url))
  }
}
