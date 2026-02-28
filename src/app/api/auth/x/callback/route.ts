import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

const X_CLIENT_ID = process.env.X_CLIENT_ID
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET
const REDIRECT_URI = 'https://clawdsocial.vercel.app/api/auth/x/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Get the current user from Clerk
  const { userId } = auth()
  
  console.log('OAuth callback - userId:', userId ? 'present' : 'missing')

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in?error=not_authenticated', request.url))
  }

  if (error) {
    console.error('X OAuth error:', error)
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
    console.log('Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      console.error('Token error:', tokenData)
      return NextResponse.redirect(
        new URL(`/settings?error=token_exchange&details=${encodeURIComponent(JSON.stringify(tokenData))}`, request.url)
      )
    }

    // Get user info from X
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
      console.error('No username in X response')
      return NextResponse.redirect(new URL('/settings?error=no_username', request.url))
    }

    // Create or get user in our database
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        name: xUser.name || xUser.username,
        imageUrl: xUser.profile_image_url
      },
      create: {
        clerkId: userId,
        email: `${userId}@clawdsocial.local`,
        name: xUser.name || xUser.username,
        imageUrl: xUser.profile_image_url
      }
    })
    console.log('DB user:', dbUser.id)

    // Create default workspace for user if not exists
    const workspace = await prisma.workspace.upsert({
      where: { slug: `user-${userId.slice(-8)}` },
      update: {},
      create: {
        name: `${xUser.name || xUser.username}'s Workspace`,
        slug: `user-${userId.slice(-8)}`,
        ownerId: dbUser.id
      }
    })
    console.log('Workspace:', workspace.id)

    // Save X connection to database
    const socialAccount = await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_accountHandle: {
          workspaceId: workspace.id,
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
    console.log('Social account saved:', socialAccount.id)

    return NextResponse.redirect(
      new URL(`/settings?connected=x&username=${encodeURIComponent(xUser.username)}`, request.url)
    )
  } catch (err) {
    console.error('OAuth exception:', err)
    return NextResponse.redirect(new URL('/settings?error=exception', request.url))
  }
}
