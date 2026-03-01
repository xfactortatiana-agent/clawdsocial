import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Pricing Tiers
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic scheduling',
    price: 0,
    priceId: null,
    features: [
      '1 social account (X)',
      '10 scheduled posts/month',
      'Basic analytics (7 days)',
      'AI composer (20 generations/month)',
      'Thread builder',
    ],
    limits: {
      accounts: 1,
      scheduledPostsPerMonth: 10,
      aiGenerationsPerMonth: 20,
      analyticsDays: 7,
      teamMembers: 1,
    },
  },
  ESSENTIAL: {
    id: 'essential',
    name: 'Essential',
    description: 'For creators building their audience',
    price: 14.99,
    priceId: process.env.STRIPE_PRICE_ID_ESSENTIAL,
    features: [
      '3 social accounts (X, Instagram, LinkedIn)',
      'Unlimited scheduled posts',
      'Full analytics (90 days)',
      'AI composer (unlimited)',
      'Thread builder',
      'Media library (50 assets)',
      'Best time to post',
      'Priority support',
    ],
    limits: {
      accounts: 3,
      scheduledPostsPerMonth: -1, // unlimited
      aiGenerationsPerMonth: -1,
      analyticsDays: 90,
      teamMembers: 1,
      mediaAssets: 50,
    },
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    description: 'For power users and teams',
    price: 44.99,
    priceId: process.env.STRIPE_PRICE_ID_PREMIUM,
    features: [
      'Unlimited social accounts (all platforms)',
      'Unlimited scheduled posts',
      'Full analytics (unlimited history)',
      'AI composer (unlimited + brand voice training)',
      'Thread builder',
      'Media library (unlimited)',
      'Best time to post',
      'Team collaboration (5 members)',
      'White-label exports',
      'API access',
      'Priority support + onboarding',
    ],
    limits: {
      accounts: -1,
      scheduledPostsPerMonth: -1,
      aiGenerationsPerMonth: -1,
      analyticsDays: -1,
      teamMembers: 5,
      mediaAssets: -1,
    },
  },
};

export type PlanId = keyof typeof PLANS;

// Check if user has exceeded plan limits
export function checkLimit(
  planId: PlanId,
  limitKey: keyof typeof PLANS.FREE.limits,
  currentUsage: number
): { allowed: boolean; limit: number; remaining: number } {
  const plan = PLANS[planId];
  const limit = plan.limits[limitKey];
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: Infinity };
  }
  
  const remaining = limit - currentUsage;
  return {
    allowed: remaining > 0,
    limit,
    remaining: Math.max(0, remaining),
  };
}

// Get upgrade message when limit hit
export function getUpgradeMessage(planId: PlanId, limitKey: string): string {
  if (planId === 'FREE') {
    return `You've reached your Free plan limit. Upgrade to Essential ($14.99/mo) for unlimited ${limitKey}.`;
  }
  if (planId === 'ESSENTIAL') {
    return `You've reached your Essential plan limit. Upgrade to Premium ($44.99/mo) for unlimited everything.`;
  }
  return 'Limit reached. Contact support for custom enterprise pricing.';
}
