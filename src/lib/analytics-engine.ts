import { prisma } from '@/lib/db';

/**
 * Audience Analytics Engine
 * 
 * Learns from user's post performance to recommend optimal posting times.
 * Updates continuously as new data comes in from daily cron jobs.
 */

interface TimeBucket {
  dayOfWeek: number;
  hourOfDay: number;
  postsCount: number;
  avgEngagementRate: number;
  totalImpressions: number;
  totalEngagements: number;
}

/**
 * Process a batch of post performance data and update audience insights
 */
export async function processPostPerformance(
  accountId: string,
  performances: Array<{
    postId: string;
    postedAt: Date;
    impressions: number;
    engagements: number;
    likes: number;
    replies: number;
    reposts: number;
    contentLength: number;
    hasMedia: boolean;
    mediaCount: number;
    hasHashtags: boolean;
    hashtagCount: number;
  }>
) {
  // Group by time bucket (day + hour)
  const buckets = new Map<string, TimeBucket>();
  
  for (const perf of performances) {
    const postedAt = new Date(perf.postedAt);
    const dayOfWeek = postedAt.getDay();
    const hourOfDay = postedAt.getHours();
    const key = `${dayOfWeek}-${hourOfDay}`;
    
    const engagementRate = perf.impressions > 0 
      ? perf.engagements / perf.impressions 
      : 0;
    
    if (!buckets.has(key)) {
      buckets.set(key, {
        dayOfWeek,
        hourOfDay,
        postsCount: 0,
        avgEngagementRate: 0,
        totalImpressions: 0,
        totalEngagements: 0,
      });
    }
    
    const bucket = buckets.get(key)!;
    bucket.postsCount++;
    bucket.totalImpressions += perf.impressions;
    bucket.totalEngagements += perf.engagements;
  }
  
  // Calculate averages and update database
  for (const [key, bucket] of Array.from(buckets.entries())) {
    bucket.avgEngagementRate = bucket.totalImpressions > 0
      ? bucket.totalEngagements / bucket.totalImpressions
      : 0;
    
    // Calculate performance score (0-100)
    // Factors: engagement rate, volume of data, recency
    const baseScore = Math.min(bucket.avgEngagementRate * 1000, 50); // Cap at 50 for engagement
    const confidenceBonus = Math.min(bucket.postsCount * 5, 30); // Up to 30 for data volume
    const performanceScore = Math.min(baseScore + confidenceBonus, 100);
    
    const confidence = Math.min(bucket.postsCount / 10, 1); // 1.0 = 10+ posts in this bucket
    
    await prisma.audienceInsight.upsert({
      where: {
        accountId_dayOfWeek_hourOfDay: {
          accountId,
          dayOfWeek: bucket.dayOfWeek,
          hourOfDay: bucket.hourOfDay,
        },
      },
      update: {
        postsCount: { increment: bucket.postsCount },
        avgImpressions: {
          set: await calculateRunningAverage(accountId, bucket.dayOfWeek, bucket.hourOfDay, 'avgImpressions', bucket.totalImpressions / bucket.postsCount),
        },
        avgEngagements: {
          set: await calculateRunningAverage(accountId, bucket.dayOfWeek, bucket.hourOfDay, 'avgEngagements', bucket.totalEngagements / bucket.postsCount),
        },
        performanceScore,
        confidence,
        lastUpdated: new Date(),
      },
      create: {
        accountId,
        dayOfWeek: bucket.dayOfWeek,
        hourOfDay: bucket.hourOfDay,
        postsCount: bucket.postsCount,
        avgImpressions: bucket.totalImpressions / bucket.postsCount,
        avgEngagements: bucket.totalEngagements / bucket.postsCount,
        performanceScore,
        confidence,
      },
    });
  }
  
  // Recalculate optimal times after updating insights
  await calculateOptimalTimes(accountId);
  
  return { processed: performances.length, buckets: buckets.size };
}

/**
 * Calculate running average for a metric
 */
async function calculateRunningAverage(
  accountId: string,
  dayOfWeek: number,
  hourOfDay: number,
  field: string,
  newValue: number
): Promise<number> {
  const existing = await prisma.audienceInsight.findUnique({
    where: {
      accountId_dayOfWeek_hourOfDay: {
        accountId,
        dayOfWeek,
        hourOfDay,
      },
    },
  });
  
  if (!existing) return newValue;
  
  const oldValue = (existing as any)[field] || 0;
  const oldCount = existing.postsCount;
  const newCount = oldCount + 1;
  
  // Weighted average: new data has 30% weight
  return (oldValue * 0.7) + (newValue * 0.3);
}

/**
 * Calculate and cache optimal posting times for each day
 */
export async function calculateOptimalTimes(accountId: string) {
  const insights = await prisma.audienceInsight.findMany({
    where: { accountId },
    orderBy: [
      { dayOfWeek: 'asc' },
      { performanceScore: 'desc' },
    ],
  });
  
  // Group by day and take top 3 slots per day
  const byDay = new Map<number, typeof insights>();
  for (const insight of insights) {
    if (!byDay.has(insight.dayOfWeek)) {
      byDay.set(insight.dayOfWeek, []);
    }
    byDay.get(insight.dayOfWeek)!.push(insight);
  }
  
  // Clear old optimal times
  await prisma.optimalTime.deleteMany({
    where: { accountId },
  });
  
  // Insert new optimal times
  for (const [dayOfWeek, dayInsights] of Array.from(byDay.entries())) {
    const topSlots = dayInsights.slice(0, 3); // Top 3 per day
    
    for (let i = 0; i < topSlots.length; i++) {
      const slot = topSlots[i];
      
      await prisma.optimalTime.create({
        data: {
          accountId,
          dayOfWeek,
          hourOfDay: slot.hourOfDay,
          minute: 0,
          reason: generateReason(slot),
          expectedReach: Math.round(slot.avgImpressions),
          rank: i + 1,
        },
      });
    }
  }
}

/**
 * Generate human-readable reason for why this time is optimal
 */
function generateReason(insight: any): string {
  const reasons: string[] = [];
  
  if (insight.confidence > 0.7) {
    reasons.push('Proven high engagement');
  } else if (insight.confidence > 0.3) {
    reasons.push('Good engagement trend');
  } else {
    reasons.push('Promising time slot');
  }
  
  if (insight.avgEngagements > 100) {
    reasons.push('High interaction rate');
  }
  
  return reasons.join(', ');
}

/**
 * Get personalized best times for the composer
 */
export async function getPersonalizedBestTimes(accountId: string) {
  const today = new Date().getDay();
  
  // Get today's optimal times first, then fill with general best times
  const optimalTimes = await prisma.optimalTime.findMany({
    where: { accountId },
    orderBy: [
      { dayOfWeek: 'asc' },
      { rank: 'asc' },
    ],
    take: 4,
  });
  
  // Map to composer format
  const timeSlots = optimalTimes.map((opt, idx) => {
    const labels = ['Morning', 'Midday', 'Afternoon', 'Evening'];
    const hour = opt.hourOfDay;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return {
      label: labels[idx] || `Slot ${idx + 1}`,
      time: `${hour.toString().padStart(2, '0')}:00`,
      desc: `${displayHour}:00 ${ampm} — ${opt.reason}`,
      score: opt.expectedReach || 0,
      isPersonalized: true,
    };
  });
  
  // If we don't have enough data, supplement with defaults
  if (timeSlots.length < 4) {
    const defaults = [
      { label: 'Morning', time: '09:00', desc: '9:00 AM — High engagement (industry avg)', score: 0, isPersonalized: false },
      { label: 'Lunch', time: '12:00', desc: '12:00 PM — Peak activity (industry avg)', score: 0, isPersonalized: false },
      { label: 'Evening', time: '18:00', desc: '6:00 PM — Commute scroll (industry avg)', score: 0, isPersonalized: false },
      { label: 'Night', time: '21:00', desc: '9:00 PM — Relaxation time (industry avg)', score: 0, isPersonalized: false },
    ];
    
    return [...timeSlots, ...defaults.slice(timeSlots.length)];
  }
  
  return timeSlots;
}

/**
 * Get recommended time for a specific day
 */
export async function getRecommendedTime(accountId: string, targetDay?: number): Promise<{
  hour: number;
  minute: number;
  reason: string;
  confidence: number;
} | null> {
  const dayOfWeek = targetDay ?? new Date().getDay();
  
  const optimal = await prisma.optimalTime.findFirst({
    where: { 
      accountId, 
      dayOfWeek,
      rank: 1,
    },
  });
  
  if (!optimal) return null;
  
  // Get confidence from audience insight
  const insight = await prisma.audienceInsight.findUnique({
    where: {
      accountId_dayOfWeek_hourOfDay: {
        accountId,
        dayOfWeek,
        hourOfDay: optimal.hourOfDay,
      },
    },
  });
  
  return {
    hour: optimal.hourOfDay,
    minute: optimal.minute,
    reason: optimal.reason,
    confidence: insight?.confidence || 0,
  };
}

/**
 * Get analytics summary for the dashboard
 */
export async function getAudienceAnalyticsSummary(accountId: string) {
  const [insights, optimalTimes, totalPosts] = await Promise.all([
    prisma.audienceInsight.findMany({
      where: { accountId },
      orderBy: { performanceScore: 'desc' },
      take: 10,
    }),
    prisma.optimalTime.findMany({
      where: { accountId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { rank: 'asc' },
      ],
    }),
    prisma.postPerformance.count({
      where: { accountId },
    }),
  ]);
  
  const bestDay = insights.length > 0 
    ? insights[0].dayOfWeek 
    : null;
  
  const bestHour = insights.length > 0
    ? insights[0].hourOfDay
    : null;
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    totalPostsAnalyzed: totalPosts,
    bestDay: bestDay !== null ? days[bestDay] : null,
    bestTime: bestHour !== null ? `${bestHour}:00` : null,
    confidence: insights[0]?.confidence || 0,
    topSlots: optimalTimes.slice(0, 5).map(opt => ({
      day: days[opt.dayOfWeek],
      time: `${opt.hourOfDay}:00`,
      reason: opt.reason,
    })),
    isLearning: totalPosts < 10, // Need at least 10 posts for reliable data
  };
}
