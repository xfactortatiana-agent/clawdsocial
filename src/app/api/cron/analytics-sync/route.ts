import { NextResponse } from 'next/server';
import { syncDailyAnalytics } from '@/lib/analytics-sync';

export const runtime = 'nodejs';

/**
 * Daily Analytics Sync Cron Job
 * 
 * Runs once per day to:
 * 1. Fetch latest post performance from X API
 * 2. Update audience insights (hourly engagement patterns)
 * 3. Recalculate optimal posting times
 * 
 * Trigger: Daily at 2 AM UTC (configurable in Vercel cron)
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncDailyAnalytics();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Synced analytics for ${result.accountsProcessed} accounts`,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (err) {
    console.error('Cron job failed:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Cron job failed' 
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
