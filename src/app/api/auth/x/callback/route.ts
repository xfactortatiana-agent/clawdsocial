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

// Base64 encode without Buffer (for Edge runtime)
function base64Encode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  while (i < str.length) {
    const a = str.charCodeAt(i++)
    const b = i < str.length ? str.charCodeAt(i++) : 0
    const c = i < str.length ? str.charCodeAt(i++) : 0
    const bitmap = (a << 16) | (b << 8) | c
    result += chars.charAt((bitmap >> 18) & 63)
    result += chars.charAt((bitmap >> 12) & 63)
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '='
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '='
  }
  return result
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('=== OAUTH CALLBACK ===')
  console.log('Code:', code ? 'present' : 'missing')
  console.log('Error:', error)

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=x_oauth&msg=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url))
  }

  if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/dashboard?error=missing_credentials', request.url))
  }

  try {
    const redirectUri = getRedirectUri()
    
    // Build auth header using custom base64
    const authString = `${X_CLIENT_ID}:${X_CLIENT_SECRET}`
    const authHeader = `Basic ${base64Encode(authString)}`

    // Exchange code for access token
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: X_CLIENT_ID,
      code_verifier: 'challenge'
    })

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      },
      body: tokenBody
    })

    const responseText = await tokenResponse.text()
    console.log('Token response:', tokenResponse.status, responseText.slice(0, 200))

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=token_exchange&status=${tokenResponse.status}`, request.url)
      )
    }

    const tokenData = JSON.parse(responseText)

    // Get user info from X
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/dashboard?error=user_info_failed', request.url))
    }

    const userData = await userResponse.json()
    const xUser = userData.data

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

    return NextResponse.redirect(new URL(`/dashboard?connected=x&username=${xUser.username}`, request.url))
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=exception', request.url))
  }
}
