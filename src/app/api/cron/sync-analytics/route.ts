import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const X_CLIENT_ID = process.env.X_CLIENT_ID
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET

// Refresh X access token
async function refreshXToken(refreshToken: string) {
  try {
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: X_CLIENT_ID || ''
      })
    })

    if (!response.ok) {
      console.error('Token refresh failed:', await response.text())
      return null
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken
    }
  } catch (err) {
    console.error('Error refreshing token:', err)
    return null
  }
}

// Fetch tweets from X API
async function fetchTweets(userId: string, accessToken: string, type: 'posts' | 'replies', maxResults: number) {
  // Use exclude parameter to filter
  // exclude=replies gets original posts only
  // No exclude gets everything (including replies)
  const excludeParam = type === 'posts' ? '&exclude=replies,retweets' : '&exclude=retweets'
  
  const url = `https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=public_metrics,created_at,referenced_tweets&max_results=${maxResults}${excludeParam}`
  
  console.log(`[Sync] Fetching ${type} from: ${url}`)
  
  const response = await fetch(url, {
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${type}: ${response.status}`)
  }

  const data = await response.json()
  const tweets = data.data || []
  
  console.log(`[Sync] Fetched ${tweets.length} ${type} (before filtering)`)
  
  // Additional client-side filtering to ensure correctness
  if (type === 'posts') {
    // Filter out any replies that might have slipped through
    return tweets.filter((t: any) => !t.referenced_tweets?.some((ref: any) => ref.type === 'replied_to'))
  } else {
    // Only keep replies
    return tweets.filter((t: any) => t.referenced_tweets?.some((ref: any) => ref.type === 'replied_to'))
  }
}

// Process and save tweets to database
async function processTweets(
  tweets: any[], 
  account: any, 
  createdById: string, 
  type: 'post' | 'reply'
) {
  let synced = 0
  let created = 0
  let updated = 0

  console.log(`[Sync] Processing ${tweets.length} ${type}s`)

  for (const tweet of tweets) {
    try {
      const existingPost = await prisma.post.findFirst({
        where: { platformPostId: tweet.id }
      })

      const postData = {
        likes: tweet.public_metrics?.like_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        reposts: tweet.public_metrics?.retweet_count || 0,
        impressions: tweet.public_metrics?.impression_count || 0,
        engagements: (tweet.public_metrics?.like_count || 0) + 
                    (tweet.public_metrics?.reply_count || 0) + 
                    (tweet.public_metrics?.retweet_count || 0)
      }

      if (existingPost) {
        await prisma.post.update({
          where: { id: existingPost.id },
          data: postData
        })
        updated++
      } else {
        await prisma.post.create({
          data: {
            workspaceId: account.workspaceId,
            accountId: account.id,
            createdById: createdById,
            content: tweet.text,
            status: 'PUBLISHED',
            publishedAt: new Date(tweet.created_at),
            platformPostId: tweet.id,
            ...postData
          }
        })
        created++
      }
      synced++
    } catch (err) {
      console.error(`[Sync] Error processing ${type} ${tweet.id}:`, err)
    }
  }

  return { synced, created, updated }
}

// This endpoint syncs analytics from X - called by cron or manually
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active X accounts with workspace owner
    const accounts = await prisma.socialAccount.findMany({
      where: { 
        platform: 'X',
        isActive: true
      },
      include: {
        workspace: {
          select: {
            ownerId: true
          }
        }
      }
    })

    if (accounts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No X accounts found to sync' 
      })
    }

    const results = []

    for (const account of accounts) {
      try {
        let accessToken = account.accessToken

        // Try to refresh token if we have a refresh token
        if (account.refreshToken && account.refreshToken !== 'clerk-managed') {
          const refreshed = await refreshXToken(account.refreshToken)
          if (refreshed) {
            await prisma.socialAccount.update({
              where: { id: account.id },
              data: {
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken
              }
            })
            accessToken = refreshed.accessToken
          }
        }

        // Get user info and follower count
        const userResponse = await fetch(
          `https://api.twitter.com/2/users/by/username/${account.accountHandle}?user.fields=public_metrics`,
          {
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!userResponse.ok) {
          const errorData = await userResponse.json()
          console.error(`Failed to fetch user for ${account.accountHandle}:`, errorData)
          
          if (userResponse.status === 401) {
            await prisma.socialAccount.update({
              where: { id: account.id },
              data: { isActive: false }
            })
          }
          
          results.push({ 
            account: account.accountHandle, 
            error: `Token expired. Please reconnect your X account in Settings.` 
          })
          continue
        }

        const userData = await userResponse.json()
        const userId = userData.data?.id
        const followerCount = userData.data?.public_metrics?.followers_count || 0

        if (!userId) {
          results.push({ 
            account: account.accountHandle, 
            error: 'No user ID found' 
          })
          continue
        }

        // Update follower count
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { 
            followerCount,
            lastSyncedAt: new Date()
          }
        })

        const createdById = account.workspace?.ownerId || account.userId || ''

        // Fetch posts (exclude replies)
        const postsTweets = await fetchTweets(userId, accessToken, 'posts', 20)
        const postsResult = await processTweets(postsTweets, account, createdById, 'post')

        // Fetch replies (include replies)
        const repliesTweets = await fetchTweets(userId, accessToken, 'replies', 20)
        const repliesResult = await processTweets(repliesTweets, account, createdById, 'reply')

        console.log(`[Sync] @${account.accountHandle}: ${postsResult.synced} posts, ${repliesResult.synced} replies, ${followerCount} followers`)

        results.push({ 
          account: account.accountHandle, 
          followerCount,
          posts: postsResult,
          replies: repliesResult
        })
      } catch (err) {
        console.error(`[Sync] Error syncing ${account.accountHandle}:`, err)
        results.push({ 
          account: account.accountHandle, 
          error: err instanceof Error ? err.message : 'Sync failed' 
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      totalAccounts: accounts.length
    })
  } catch (err) {
    console.error('[Sync] Cron error:', err)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
