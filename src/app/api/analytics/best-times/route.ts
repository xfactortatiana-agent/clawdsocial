import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getPersonalizedBestTimes, getAudienceAnalyticsSummary } from '@/lib/analytics-engine';

export const runtime = 'nodejs';

// GET - Fetch personalized best times for the composer
export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Get user's X account
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
      return NextResponse.json({ times: [] });
    }

    const account = await prisma.socialAccount.findFirst({
      where: { 
        workspaceId: workspace.id,
        platform: 'X',
        isActive: true
      }
    });

    if (!account) {
      return NextResponse.json({ times: [] });
    }

    // Get personalized best times
    const times = await getPersonalizedBestTimes(account.id);
    
    // Get analytics summary for context
    const summary = await getAudienceAnalyticsSummary(account.id);

    return NextResponse.json({ 
      times,
      summary: {
        isLearning: summary.isLearning,
        totalPostsAnalyzed: summary.totalPostsAnalyzed,
        bestDay: summary.bestDay,
        bestTime: summary.bestTime,
      }
    });
  } catch (err) {
    console.error('Error fetching best times:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
