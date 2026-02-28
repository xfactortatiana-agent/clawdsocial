import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const X_CLIENT_ID = process.env.X_CLIENT_ID
const REDIRECT_URI = 'https://clawdsocial.vercel.app/api/auth/x/callback'

// Import the store from callback route
let oauthStates: Map<string, string>

async function getOAuthStates() {
  if (!oauthStates) {
    const callbackModule = await import('./callback/route')
    oauthStates = callbackModule.oauthStates
  }
  return oauthStates
}

export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!X_CLIENT_ID) {
    return NextResponse.json({ error: 'X_CLIENT_ID not configured' }, { status: 500 })
  }

  const state = Math.random().toString(36).substring(2, 15)
  
  const states = await getOAuthStates()
  states.set(state, userId)

  const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', X_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', 'challenge')
  authUrl.searchParams.set('code_challenge_method', 'plain')

  return NextResponse.redirect(authUrl.toString())
}
