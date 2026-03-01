import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

// POST - Create and optionally publish a post
export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { posts, isThread, scheduledFor, platform } = body;

    // Support both old format (content, platform) and new format (posts array)
    let content: string;
    let mediaUrls: string[] = [];
    
    if (posts && Array.isArray(posts) && posts.length > 0) {
      // New format: array of posts (threads)
      content = posts.map((p: any) => p.content).join('\n\n');
      mediaUrls = posts.flatMap((p: any) => p.mediaUrls || []);
    } else if (body.content) {
      // Old format: single content string
      content = body.content;
      mediaUrls = body.mediaUrls || [];
    } else {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!content || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's workspace
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: user.id }
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get X account
    const account = await prisma.socialAccount.findFirst({
      where: { 
        workspaceId: workspace.id,
        platform: 'X',
        isActive: true
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'No X account connected' }, { status: 400 });
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
    });

    // If no schedule time and publishNow was requested, publish immediately
    if (!scheduledFor && body.publishNow) {
      // For now, just mark as published (actual X API integration can be added later)
      await prisma.post.update({
        where: { id: post.id },
        data: { 
          status: 'PUBLISHED',
          publishedAt: new Date(),
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        post: { ...post, status: 'PUBLISHED' }
      });
    }

    return NextResponse.json({ success: true, post });
  } catch (err) {
    console.error('Error creating post:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch user's posts
export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ posts: [] });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: user.id }
    });

    if (!workspace) {
      return NextResponse.json({ posts: [] });
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
    });

    return NextResponse.json({ posts });
  } catch (err) {
    console.error('Error fetching posts:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
