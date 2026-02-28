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

    const results = []

    for (const account of accounts) {
      try {
        // Fetch user's tweets from X API
        const tweetsResponse = await fetch(
          `https://api.twitter.com/2/users/by/username/${account.accountHandle}?tweet.fields=public_metrics,created_at`,
          {
            headers: { 'Authorization': `Bearer ${account.accessToken}` }
          }
        )

        if (!tweetsResponse.ok) {
          console.error(`Failed to fetch user for ${account.accountHandle}`)
          continue
        }

        const userData = await tweetsResponse.json()
        const userId = userData.data?.id

        if (!userId) continue

        // Fetch recent tweets
        const tweets = await fetch(
          `https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=public_metrics,created_at&max_results=100`,
          {
            headers: { 'Authorization': `Bearer ${account.accessToken}` }
          }
        )

        if (!tweets.ok) {
          console.error(`Failed to fetch tweets for ${account.accountHandle}`)
          continue
        }

        const tweetsData = await tweets.json()
        
        // Update follower count
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { 
            followerCount: userData.data?.public_metrics?.followers_count || 0,
            lastSyncedAt: new Date()
          }
        })

        // Update posts with analytics
        for (const tweet of tweetsData.data || []) {
          const existingPost = await prisma.post.findFirst({
            where: { platformPostId: tweet.id }
          })

          if (existingPost) {
            await prisma.post.update({
              where: { id: existingPost.id },
              data: {
                likes: tweet.public_metrics?.like_count,
                replies: tweet.public_metrics?.reply_count,
                reposts: tweet.public_metrics?.retweet_count,
                impressions: tweet.public_metrics?.impression_count,
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
                likes: tweet.public_metrics?.like_count,
                replies: tweet.public_metrics?.reply_count,
                reposts: tweet.public_metrics?.retweet_count,
                impressions: tweet.public_metrics?.impression_count,
                engagements: (tweet.public_metrics?.like_count || 0) + 
                            (tweet.public_metrics?.reply_count || 0) + 
                            (tweet.public_metrics?.retweet_count || 0)
              }
            })
          }
        }

        results.push({ account: account.accountHandle, synced: tweetsData.data?.length || 0 })
      } catch (err) {
        console.error(`Error syncing ${account.accountHandle}:`, err)
        results.push({ account: account.accountHandle, error: 'Sync failed' })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
