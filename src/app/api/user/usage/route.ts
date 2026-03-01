import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { PlanId, PLANS } from '@/lib/stripe';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ 
        plan: 'FREE',
        scheduledPostsThisMonth: 0,
        aiGenerationsThisMonth: 0,
        connectedAccounts: 0,
      });
    }

    const planId = (user.plan?.toLowerCase() || 'free') as PlanId;

    // Get start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Count scheduled posts this month
    const scheduledPostsThisMonth = await prisma.post.count({
      where: {
        createdById: user.id,
        status: 'SCHEDULED',
        createdAt: { gte: startOfMonth },
      },
    });

    // Count AI generations this month
    const aiGenerationsThisMonth = await prisma.post.count({
      where: {
        createdById: user.id,
        aiGenerated: true,
        createdAt: { gte: startOfMonth },
      },
    });

    // Count connected accounts
    const connectedAccounts = await prisma.socialAccount.count({
      where: {
        workspace: {
          ownerId: user.id,
        },
        isActive: true,
      },
    });

    return NextResponse.json({
      plan: planId,
      scheduledPostsThisMonth,
      aiGenerationsThisMonth,
      connectedAccounts,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ 
      plan: 'FREE',
      scheduledPostsThisMonth: 0,
      aiGenerationsThisMonth: 0,
      connectedAccounts: 0,
    });
  }
}
