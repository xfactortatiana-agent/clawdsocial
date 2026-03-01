"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Zap,
  Crown,
  Sparkles,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { PLANS, PlanId } from "@/lib/stripe";

interface UsageData {
  plan: PlanId;
  scheduledPostsThisMonth: number;
  aiGenerationsThisMonth: number;
  connectedAccounts: number;
}

export function UsageWidget() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/user/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !usage) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-slate-800 rounded"></div>
          <div className="h-3 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  const plan = PLANS[usage.plan] || PLANS.FREE;
  const isFree = usage.plan === 'FREE';

  // Calculate percentages
  const postLimit = plan.limits.scheduledPostsPerMonth;
  const aiLimit = plan.limits.aiGenerationsPerMonth;
  const accountLimit = plan.limits.accounts;

  const postPercent = postLimit > 0 ? (usage.scheduledPostsThisMonth / postLimit) * 100 : 0;
  const aiPercent = aiLimit > 0 ? (usage.aiGenerationsThisMonth / aiLimit) * 100 : 0;
  const accountPercent = accountLimit > 0 ? (usage.connectedAccounts / accountLimit) * 100 : 0;

  const getIcon = () => {
    switch (usage.plan) {
      case 'FREE': return <Sparkles className="w-5 h-5 text-slate-400" />;
      case 'ESSENTIAL': return <Zap className="w-5 h-5 text-violet-400" />;
      case 'PREMIUM': return <Crown className="w-5 h-5 text-amber-400" />;
      default: return <Sparkles className="w-5 h-5 text-slate-400" />;
    }
  };

  const ProgressBar = ({ 
    current, 
    limit, 
    label, 
    percent 
  }: { 
    current: number; 
    limit: number; 
    label: string;
    percent: number;
  }) => {
    const isUnlimited = limit === -1;
    const isWarning = percent >= 80;
    const isOver = percent >= 100;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">{label}</span>
          <span className={isOver ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-300'}>
            {isUnlimited ? (
              'Unlimited'
            ) : (
              `${current} / ${limit}`
            )}
          </span>
        </div>
        {!isUnlimited && (
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-violet-500'
              }`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <p className="font-semibold text-white">{plan.name} Plan</p>
            <p className="text-sm text-slate-400">
              {isFree ? 'Free forever' : `$${plan.price}/month`}
            </p>
          </div>
        </div>

        <Link 
          href="/billing"
          className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
        >
          {isFree ? 'Upgrade' : 'Manage'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Usage Bars */}
      <div className="space-y-4">
        <ProgressBar
          label="Scheduled Posts"
          current={usage.scheduledPostsThisMonth}
          limit={postLimit}
          percent={postPercent}
        />

        <ProgressBar
          label="AI Generations"
          current={usage.aiGenerationsThisMonth}
          limit={aiLimit}
          percent={aiPercent}
        />

        <ProgressBar
          label="Connected Accounts"
          current={usage.connectedAccounts}
          limit={accountLimit}
          percent={accountPercent}
        />
      </div>

      {/* Warning / Upgrade CTA */}
      {(postPercent >= 80 || aiPercent >= 80 || accountPercent >= 80) && isFree && (
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-400 font-medium mb-1">Approaching limit</p>
              <p className="text-sm text-slate-300 mb-3">
                Upgrade to Essential for unlimited posts and AI generations.
              </p>
              <Link
                href="/billing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Upgrade to Essential
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
