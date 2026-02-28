import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

// POST - Create and optionally publish a post
export async function POST(request: Request) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content, platform, scheduledFor, mediaUrls = [] } = body

    if (!content || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user's workspace
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: user.id }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
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
      return NextResponse.json({ error: 'No X account connected' }, { status: 400 })
    }

    // Create post in database
    const post = await prisma.post.create({
      data: {
        workspaceId: workspace.id,
        content,
        status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        mediaUrls,
        accountId: account.id,
        createdById: user.id
      }
    })

    // If no schedule time, publish immediately
    if (!scheduledFor) {
      const result = await publishToX(post.content, account.accessToken, mediaUrls)
      
      if (result.success) {
        await prisma.post.update({
          where: { id: post.id },
          data: { 
            status: 'PUBLISHED',
            publishedAt: new Date(),
            platformPostId: result.tweetId
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          post: { ...post, status: 'PUBLISHED', platformPostId: result.tweetId }
        })
      } else {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: 'FAILED' }
        })
        
        return NextResponse.json({ 
          error: 'Failed to publish', 
          details: result.error 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, post })
  } catch (err) {
    console.error('Error creating post:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Fetch user's posts
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
      return NextResponse.json({ posts: [] })
    }

    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: user.id }
    })

    if (!workspace) {
      return NextResponse.json({ posts: [] })
    }

    const posts = await prisma.post.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: {
            accountHandle: true,
            profileImageUrl: true
          }
        }
      }
    })

    return NextResponse.json({ posts })
  } catch (err) {
    console.error('Error fetching posts:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Publish to X API
async function publishToX(text: string, accessToken: string, mediaUrls: string[] = []) {
  try {
    // For now, just text posts. Media will be added next.
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('X API error:', data)
      return { 
        success: false, 
        error: data.detail || data.errors?.[0]?.message || 'Unknown error' 
      }
    }

    return { 
      success: true, 
      tweetId: data.data?.id 
    }
  } catch (err) {
    console.error('Error publishing to X:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Network error' 
    }
  }
}
