import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

// POST - Save a draft post
export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tweets, isThread } = body;

    if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
      return NextResponse.json({ error: 'No content to save' }, { status: 400 });
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

    // Combine all tweets into content (for now, just first tweet)
    const content = tweets.map((t: any) => t.content).join('\n\n');
    const mediaUrls = tweets.flatMap((t: any) => t.media?.map((m: any) => m.url) || []);

    // Create draft post
    const post = await prisma.post.create({
      data: {
        workspaceId: workspace.id,
        content,
        status: 'DRAFT',
        mediaUrls,
        accountId: account.id,
        createdById: user.id,
        aiGenerated: false
      }
    });

    return NextResponse.json({ success: true, post });
  } catch (err) {
    console.error('Error saving draft:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
