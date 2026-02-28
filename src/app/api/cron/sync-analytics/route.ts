import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

// This endpoint syncs analytics from X - called by cron or manually
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active X accounts
    const accounts = await prisma.socialAccount.findMany({
      where: { 
        platform: 'X',
        isActive: true
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
        // First get the user ID from username
        const userResponse = await fetch(
          `https://api.twitter.com/2/users/by/username/${account.accountHandle}`,
          {
            headers: { 
              'Authorization': `Bearer ${account.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!userResponse.ok) {
          const errorData = await userResponse.json()
          console.error(`Failed to fetch user for ${account.accountHandle}:`, errorData)
          results.push({ 
            account: account.accountHandle, 
            error: `User lookup failed: ${errorData.detail || userResponse.status}` 
          })
          continue
        }

        const userData = await userResponse.json()
        const userId = userData.data?.id

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
            followerCount: userData.data?.public_metrics?.followers_count || 0,
            lastSyncedAt: new Date()
          }
        })

        // Fetch recent tweets
        const tweetsResponse = await fetch(
          `https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=public_metrics,created_at&max_results=100`,
          {
            headers: { 
              'Authorization': `Bearer ${account.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!tweetsResponse.ok) {
          const errorData = await tweetsResponse.json()
          console.error(`Failed to fetch tweets for ${account.accountHandle}:`, errorData)
          results.push({ 
            account: account.accountHandle, 
            error: `Tweets fetch failed: ${errorData.detail || tweetsResponse.status}` 
          })
          continue
        }

        const tweetsData = await tweetsResponse.json()
        const tweets = tweetsData.data || []
        let synced = 0

        // Update posts with analytics
        for (const tweet of tweets) {
          try {
            const existingPost = await prisma.post.findFirst({
              where: { platformPostId: tweet.id }
            })

            if (existingPost) {
              await prisma.post.update({
                where: { id: existingPost.id },
                data: {
                  likes: tweet.public_metrics?.like_count || 0,
                  replies: tweet.public_metrics?.reply_count || 0,
                  reposts: tweet.public_metrics?.retweet_count || 0,
                  impressions: tweet.public_metrics?.impression_count || 0,
                  engagements: (tweet.public_metrics?.like_count || 0) + 
                              (tweet.public_metrics?.reply_count || 0) + 
                              (tweet.public_metrics?.retweet_count || 0)
                }
              })
            } else {
              // Create post record for historical tweets
              await prisma.post.create({
                data: {
                  workspaceId: account.workspaceId,
                  accountId: account.id,
                  createdById: account.userId || '',
                  content: tweet.text,
                  status: 'PUBLISHED',
                  publishedAt: new Date(tweet.created_at),
                  platformPostId: tweet.id,
                  likes: tweet.public_metrics?.like_count || 0,
                  replies: tweet.public_metrics?.reply_count || 0,
                  reposts: tweet.public_metrics?.retweet_count || 0,
                  impressions: tweet.public_metrics?.impression_count || 0,
                  engagements: (tweet.public_metrics?.like_count || 0) + 
                              (tweet.public_metrics?.reply_count || 0) + 
                              (tweet.public_metrics?.retweet_count || 0)
                }
              })
            }
            synced++
          } catch (err) {
            console.error(`Error processing tweet ${tweet.id}:`, err)
          }
        }

        results.push({ 
          account: account.accountHandle, 
          synced,
          totalFetched: tweets.length
        })
      } catch (err) {
        console.error(`Error syncing ${account.accountHandle}:`, err)
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
    console.error('Cron error:', err)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
