import { prisma } from '@/lib/db';
import { processPostPerformance } from '@/lib/analytics-engine';

/**
 * Daily Analytics Sync Job
 * 
 * Runs once per day to:
 * 1. Fetch latest post performance data from X API
 * 2. Store raw performance metrics
 * 3. Update audience insights (hourly engagement patterns)
 * 4. Recalculate optimal posting times
 */

export async function syncDailyAnalytics() {
  console.log('[Analytics Sync] Starting daily analytics sync...');
  
  const startTime = Date.now();
  
  try {
    // Get all active X accounts
    const accounts = await prisma.socialAccount.findMany({
      where: {
        platform: 'X',
        isActive: true,
      },
    });
    
    console.log(`[Analytics Sync] Found ${accounts.length} active X accounts`);
    
    for (const account of accounts) {
      try {
        await syncAccountAnalytics(account);
      } catch (err) {
        console.error(`[Analytics Sync] Failed to sync account ${account.id}:`, err);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Analytics Sync] Completed in ${duration}ms`);
    
    return { success: true, accountsProcessed: accounts.length };
  } catch (err) {
    console.error('[Analytics Sync] Fatal error:', err);
    return { success: false, error: err };
  }
}

async function syncAccountAnalytics(account: any) {
  console.log(`[Analytics Sync] Syncing account: ${account.accountHandle}`);
  
  // Get posts that need performance data synced
  // (published in the last 30 days, not synced in last 24 hours)
  const postsNeedingSync = await prisma.post.findMany({
    where: {
      accountId: account.id,
      status: 'PUBLISHED',
      platformPostId: { not: null },
      publishedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
      OR: [
        { updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Not updated in 24h
        { impressions: null }, // Never synced
      ],
    },
    take: 100, // Process in batches
  });
  
  console.log(`[Analytics Sync] ${postsNeedingSync.length} posts need sync`);
  
  if (postsNeedingSync.length === 0) return;
  
  // Fetch metrics from X API
  const metrics = await fetchXPostMetrics(
    account.accessToken,
    postsNeedingSync.map(p => p.platformPostId!).filter(Boolean)
  );
  
  // Store raw performance data
  const performances = [];
  
  for (const post of postsNeedingSync) {
    const metric = metrics[post.platformPostId!];
    if (!metric) continue;
    
    // Update post with latest metrics
    await prisma.post.update({
      where: { id: post.id },
      data: {
        impressions: metric.impressions,
        engagements: metric.engagements,
        likes: metric.likes,
        replies: metric.replies,
        reposts: metric.reposts,
        clicks: metric.clicks,
      },
    });
    
    // Store in performance table for ML
    const performance = await prisma.postPerformance.upsert({
      where: { postId: post.id },
      update: {
        impressions: metric.impressions,
        engagements: metric.engagements,
        likes: metric.likes,
        replies: metric.replies,
        reposts: metric.reposts,
        clicks: metric.clicks,
        engagementRate: metric.impressions > 0 
          ? metric.engagements / metric.impressions 
          : 0,
        lastSyncedAt: new Date(),
      },
      create: {
        postId: post.id,
        accountId: account.id,
        postedAt: post.publishedAt!,
        dayOfWeek: post.publishedAt!.getDay(),
        hourOfDay: post.publishedAt!.getHours(),
        impressions: metric.impressions,
        engagements: metric.engagements,
        likes: metric.likes,
        replies: metric.replies,
        reposts: metric.reposts,
        clicks: metric.clicks,
        engagementRate: metric.impressions > 0 
          ? metric.engagements / metric.impressions 
          : 0,
        contentLength: post.content.length,
        hasMedia: post.mediaUrls.length > 0,
        mediaCount: post.mediaUrls.length,
        hasHashtags: post.content.includes('#'),
        hashtagCount: (post.content.match(/#/g) || []).length,
      },
    });
    
    performances.push({
      postId: post.id,
      postedAt: post.publishedAt!,
      impressions: metric.impressions,
      engagements: metric.engagements,
      likes: metric.likes,
      replies: metric.replies,
      reposts: metric.reposts,
      clicks: metric.clicks,
      contentLength: post.content.length,
      hasMedia: post.mediaUrls.length > 0,
      mediaCount: post.mediaUrls.length,
      hasHashtags: post.content.includes('#'),
      hashtagCount: (post.content.match(/#/g) || []).length,
    });
  }
  
  // Process for audience insights
  if (performances.length > 0) {
    const result = await processPostPerformance(account.id, performances);
    console.log(`[Analytics Sync] Processed ${result.processed} posts, ${result.buckets} time buckets`);
  }
  
  // Update account last synced
  await prisma.socialAccount.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });
}

/**
 * Fetch post metrics from X API
 */
async function fetchXPostMetrics(
  accessToken: string,
  tweetIds: string[]
): Promise<Record<string, any>> {
  if (tweetIds.length === 0) return {};
  
  const metrics: Record<string, any> = {};
  
  // X API v2 allows fetching up to 100 tweets at a time
  const batchSize = 100;
  
  for (let i = 0; i < tweetIds.length; i += batchSize) {
    const batch = tweetIds.slice(i, i + batchSize);
    
    try {
      const response = await fetch(
        `https://api.twitter.com/2/tweets?ids=${batch.join(',')}&tweet.fields=public_metrics,non_public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        console.error(`[X API] Error fetching metrics: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.data) {
        for (const tweet of data.data) {
          const m = tweet.public_metrics || {};
          const nm = tweet.non_public_metrics || {};
          
          metrics[tweet.id] = {
            impressions: nm.impression_count || m.impression_count || 0,
            engagements: m.like_count + m.reply_count + m.retweet_count + m.quote_count || 0,
            likes: m.like_count || 0,
            replies: m.reply_count || 0,
            reposts: m.retweet_count || 0,
            clicks: m.url_link_clicks || 0,
          };
        }
      }
    } catch (err) {
      console.error('[X API] Error fetching batch:', err);
    }
  }
  
  return metrics;
}

/**
 * Fetch follower analytics (for growth tracking)
 */
export async function syncFollowerAnalytics(account: any) {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${account.accountHandle}?user.fields=public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      console.error(`[X API] Error fetching user metrics: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.data?.public_metrics) {
      const metrics = data.data.public_metrics;
      
      // Update follower count
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { 
          followerCount: metrics.followers_count || 0,
        },
      });
      
      // Store daily snapshot
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await prisma.analyticsSnapshot.upsert({
        where: {
          accountId_date: {
            accountId: account.id,
            date: today,
          },
        },
        update: {
          followerCount: metrics.followers_count || 0,
        },
        create: {
          accountId: account.id,
          date: today,
          followerCount: metrics.followers_count || 0,
          followerGrowth: 0, // Calculate from previous day
          impressions: 0,
          engagements: 0,
          likes: 0,
          replies: 0,
          reposts: 0,
          clicks: 0,
        },
      });
    }
  } catch (err) {
    console.error('[Analytics Sync] Error syncing follower analytics:', err);
  }
}
