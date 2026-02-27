import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/posts - List all posts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const status = searchParams.get('status')
    
    const posts = await prisma.post.findMany({
      where: {
        ...(workspaceId && { workspaceId }),
        ...(status && { status }),
      },
      include: {
        account: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    })
    
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create a new post
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      workspaceId,
      accountId,
      createdById,
      content,
      threadItems,
      mediaUrls,
      mediaType,
      scheduledFor,
      tags,
      category,
    } = body
    
    const post = await prisma.post.create({
      data: {
        workspaceId,
        accountId,
        createdById,
        content,
        threadItems: threadItems || [],
        mediaUrls: mediaUrls || [],
        mediaType: mediaType || 'NONE',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        tags: tags || [],
        category,
        status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
      },
      include: {
        account: true,
      }
    })
    
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
