import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

const X_CLIENT_ID = process.env.X_CLIENT_ID
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET
const REDIRECT_URI = 'https://clawdsocial.vercel.app/api/auth/x/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  console.log('=== X OAUTH CALLBACK ===')
  console.log('Code:', code ? 'present' : 'missing')
  console.log('State param:', state)

  if (error) {
    console.error('X error:', error)
    return NextResponse.redirect(new URL(`/settings?error=x_oauth`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code', request.url))
  }

  // Get clerkId from cookie
  const cookieStore = cookies()
  const clerkId = cookieStore.get('oauth_clerk_id')?.value
  const storedState = cookieStore.get('oauth_state')?.value

  console.log('Cookie clerkId:', clerkId ? 'present' : 'missing')
  console.log('Cookie state:', storedState)
  console.log('State match:', storedState === state)

  if (!clerkId) {
    console.error('No clerkId cookie')
    return NextResponse.redirect(new URL('/settings?error=no_session', request.url))
  }

  if (storedState !== state) {
    console.error('State mismatch')
    return NextResponse.redirect(new URL('/settings?error=invalid_state', request.url))
  }

  try {
    // Exchange code for token
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
    console.log('Token status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      console.error('Token error:', JSON.stringify(tokenData))
      return NextResponse.redirect(new URL(`/settings?error=token_failed`, request.url))
    }

    // Get X user info
    console.log('Getting X user info...')
    
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    })

    if (!userResponse.ok) {
      console.error('User info failed:', userResponse.status)
      return NextResponse.redirect(new URL('/settings?error=user_info_failed', request.url))
    }

    const userData = await userResponse.json()
    const xUser = userData.data
    console.log('X username:', xUser?.username)

    if (!xUser?.username) {
      return NextResponse.redirect(new URL('/settings?error=no_username', request.url))
    }

    // Save to database
    console.log('Saving to database...')
    
    const dbUser = await prisma.user.upsert({
      where: { clerkId },
      update: { 
        name: xUser.name || xUser.username, 
        imageUrl: xUser.profile_image_url 
      },
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

    console.log('Success! Redirecting...')

    // Clear cookies and redirect
    const response = NextResponse.redirect(
      new URL(`/settings?success=connected`, request.url)
    )
    response.cookies.delete('oauth_clerk_id')
    response.cookies.delete('oauth_state')
    
    return response

  } catch (err) {
    console.error('Exception:', err)
    return NextResponse.redirect(new URL('/settings?error=exception', request.url))
  }
}
