import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const X_CLIENT_ID = process.env.X_CLIENT_ID
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET
const REDIRECT_URI = 'https://clawdsocial.vercel.app/api/auth/x/callback'

// In-memory store for OAuth state
const oauthStates = new Map()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  console.log('=== X OAUTH CALLBACK ===')
  console.log('Code:', code ? `${code.slice(0, 10)}...` : 'missing')
  console.log('State:', state)

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=x_oauth&msg=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code', request.url))
  }

  const clerkId = oauthStates.get(state)
  if (!clerkId) {
    console.error('No clerkId for state:', state)
    return NextResponse.redirect(new URL('/settings?error=session_expired', request.url))
  }
  
  oauthStates.delete(state)

  try {
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
      return NextResponse.redirect(new URL(`/settings?error=token_exchange`, request.url))
    }

    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/settings?error=user_info_failed', request.url))
    }

    const userData = await userResponse.json()
    const xUser = userData.data

    if (!xUser?.username) {
      return NextResponse.redirect(new URL('/settings?error=no_username', request.url))
    }

    // Save to database
    const dbUser = await prisma.user.upsert({
      where: { clerkId },
      update: { name: xUser.name || xUser.username, imageUrl: xUser.profile_image_url },
      create: {
        clerkId,
        email: `${clerkId.slice(0, 8)}@clawdsocial.local`,
        name: xUser.name || xUser.username,
        imageUrl: xUser.profile_image_url
      }
    })

    const workspace = await prisma.workspace.upsert({
      where: { slug: `user-${clerkId.slice(-8)}` },
      update: {},
      create: {
        name: `${xUser.name || xUser.username}'s Workspace`,
        slug: `user-${clerkId.slice(-8)}`,
        ownerId: dbUser.id
      }
    })

    await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_accountHandle: {
          workspaceId: workspace.id,
          platform: 'X',
          accountHandle: xUser.username
        }
      },
      update: {
        accountName: xUser.name || xUser.username,
        profileImageUrl: xUser.profile_image_url,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        isActive: true
      },
      create: {
        workspaceId: workspace.id,
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
      new URL(`/settings?success=connected&username=${encodeURIComponent(xUser.username)}`, request.url)
    )
  } catch (err) {
    console.error('OAuth error:', err)
    return NextResponse.redirect(new URL('/settings?error=exception', request.url))
  }
}

// Export the store for the other route
export { oauthStates }
