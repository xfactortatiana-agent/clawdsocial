import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { checkLimit, getUpgradeMessage, PLANS, PlanId } from '@/lib/stripe';

// Middleware to check plan limits before allowing actions
export async function checkPlanLimit(
  req: NextRequest,
  limitKey: keyof typeof PLANS.FREE.limits
): Promise<{ allowed: boolean; response?: NextResponse }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { allowed: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return { allowed: false, response: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
    }

    const planId = (user.plan?.toLowerCase() || 'free') as PlanId;
    const plan = PLANS[planId] || PLANS.FREE;

    // Get current usage based on limit type
    let currentUsage = 0;

    switch (limitKey) {
      case 'scheduledPostsPerMonth':
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        currentUsage = await prisma.post.count({
          where: {
            createdById: user.id,
            status: 'SCHEDULED',
            createdAt: { gte: startOfMonth },
          },
        });
        break;

      case 'aiGenerationsPerMonth':
        // Track AI usage in a separate table or use Redis
        // For now, we'll check based on posts created with AI flag
        const aiStartOfMonth = new Date();
        aiStartOfMonth.setDate(1);
        aiStartOfMonth.setHours(0, 0, 0, 0);
        
        currentUsage = await prisma.post.count({
          where: {
            createdById: user.id,
            aiGenerated: true,
            createdAt: { gte: aiStartOfMonth },
          },
        });
        break;

      case 'accounts':
        currentUsage = await prisma.socialAccount.count({
          where: {
            workspace: {
              ownerId: user.id,
            },
          },
        });
        break;

      case 'teamMembers':
        currentUsage = await prisma.workspaceMember.count({
          where: {
            workspace: {
              ownerId: user.id,
            },
          },
        });
        break;

      default:
        break;
    }

    const limitCheck = checkLimit(planId, limitKey, currentUsage);

    if (!limitCheck.allowed) {
      return {
        allowed: false,
        response: NextResponse.json({
          error: 'Plan limit reached',
          message: getUpgradeMessage(planId, limitKey),
          limit: limitCheck.limit,
          current: currentUsage,
          remaining: limitCheck.remaining,
        }, { status: 403 }),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Plan limit check error:', error);
    return { allowed: true }; // Fail open to avoid blocking users
  }
}
