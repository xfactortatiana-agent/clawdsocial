import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const X_CLIENT_ID = process.env.X_CLIENT_ID
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET

const getRedirectUri = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/auth/x/callback`
  }
  return 'http://localhost:3000/api/auth/x/callback'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('=== OAUTH CALLBACK DEBUG ===')
  console.log('Full URL:', request.url)
  console.log('Code:', code ? `${code.slice(0, 20)}...` : 'null')
  console.log('Error from X:', error)
  console.log('Error description:', errorDescription)
  console.log('State:', state)

  // Check for OAuth errors from X
  if (error) {
    console.error('X returned error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/dashboard?error=x_oauth&msg=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    console.error('No code received')
    return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url))
  }

  if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
    console.error('Missing credentials')
    return NextResponse.redirect(new URL('/dashboard?error=missing_credentials', request.url))
  }

  try {
    const redirectUri = getRedirectUri()
    console.log('Redirect URI:', redirectUri)

    // Build auth header
    const authHeader = `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`
    console.log('Auth header length:', authHeader.length)

    // Exchange code for access token
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: X_CLIENT_ID,
      code_verifier: 'challenge'
    })

    console.log('Token request body:', tokenBody.toString())

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      },
      body: tokenBody
    })

    console.log('Token response status:', tokenResponse.status)
    
    const responseText = await tokenResponse.text()
    console.log('Token response body:', responseText)

    let tokenData
    try {
      tokenData = JSON.parse(responseText)
    } catch {
      tokenData = { raw: responseText }
    }

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      return NextResponse.redirect(
        new URL(`/dashboard?error=token_exchange&status=${tokenResponse.status}`, request.url)
      )
    }

    console.log('Token exchange successful')

    // Get user info from X
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userResponse.ok) {
      const userError = await userResponse.text()
      console.error('Failed to get user info:', userError)
      return NextResponse.redirect(new URL('/dashboard?error=user_info_failed', request.url))
    }

    const userData = await userResponse.json()
    const xUser = userData.data

    console.log('Got X user:', xUser?.username)

    // Store in database
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
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        isActive: true
      }
    })

    console.log('Saved to database, redirecting...')
    return NextResponse.redirect(new URL(`/dashboard?connected=x&username=${xUser.username}`, request.url))
  } catch (error) {
    console.error('Exception in callback:', error)
    return NextResponse.redirect(new URL('/dashboard?error=exception', request.url))
  }
}
