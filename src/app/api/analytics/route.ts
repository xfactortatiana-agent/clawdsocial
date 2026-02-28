import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

// GET - Fetch analytics for user's X account
export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ analytics: null })
    }

    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: user.id }
    })

    if (!workspace) {
      return NextResponse.json({ analytics: null })
    }

    // Get X account
    const account = await prisma.socialAccount.findFirst({
      where: { 
        workspaceId: workspace.id,
        platform: 'X',
        isActive: true
      }
    })

    if (!account) {
      return NextResponse.json({ analytics: null })
    }

    // Fetch published posts with analytics
    const posts = await prisma.post.findMany({
      where: { 
        accountId: account.id,
        status: 'PUBLISHED'
      },
      orderBy: { publishedAt: 'desc' },
      take: 50
    })

    // Calculate totals
    const totalPosts = posts.length
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0)
    const totalReplies = posts.reduce((sum, p) => sum + (p.replies || 0), 0)
    const totalReposts = posts.reduce((sum, p) => sum + (p.reposts || 0), 0)
    const totalImpressions = posts.reduce((sum, p) => sum + (p.impressions || 0), 0)
    const totalEngagements = posts.reduce((sum, p) => sum + (p.engagements || 0), 0)

    // Get follower count from account
    const followerCount = account.followerCount

    // Calculate engagement rate
    const engagementRate = totalImpressions > 0 
      ? ((totalEngagements / totalImpressions) * 100).toFixed(2)
      : '0.00'

    // Get posts from last 30 days for recent stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentPosts = posts.filter(p => p.publishedAt && p.publishedAt >= thirtyDaysAgo)
    const postsThisMonth = recentPosts.length

    return NextResponse.json({
      analytics: {
        account: {
          handle: account.accountHandle,
          profileImageUrl: account.profileImageUrl,
          followerCount,
          connectedAt: account.connectedAt
        },
        overview: {
          totalPosts,
          postsThisMonth,
          totalLikes,
          totalReplies,
          totalReposts,
          totalImpressions,
          totalEngagements,
          engagementRate: `${engagementRate}%`
        },
        recentPosts: posts.slice(0, 10).map(p => ({
          id: p.id,
          content: p.content.slice(0, 100) + (p.content.length > 100 ? '...' : ''),
          publishedAt: p.publishedAt,
          likes: p.likes || 0,
          replies: p.replies || 0,
          reposts: p.reposts || 0,
          impressions: p.impressions || 0,
          engagements: p.engagements || 0
        }))
      }
    })
  } catch (err) {
    console.error('Error fetching analytics:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
