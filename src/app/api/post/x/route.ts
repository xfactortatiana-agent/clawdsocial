import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/post/x - Post to X
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content, accountId } = body

    if (!content || content.length > 280) {
      return NextResponse.json(
        { error: 'Content must be 1-280 characters' },
        { status: 400 }
      )
    }

    // Get the X account from database
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId }
    })

    if (!account || account.platform !== 'X') {
      return NextResponse.json(
        { error: 'X account not found' },
        { status: 404 }
      )
    }

    // Post to X API
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: content })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('X API error:', error)
      return NextResponse.json(
        { error: 'Failed to post to X', details: error },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Store the post in database
    const post = await prisma.post.create({
      data: {
        workspaceId: account.workspaceId,
        accountId: account.id,
        createdById: 'temp-user-id', // Replace with actual user ID from auth
        content,
        status: 'PUBLISHED',
        platformPostId: data.data.id,
        publishedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      post,
      tweetId: data.data.id 
    })
  } catch (error) {
    console.error('Post to X error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
