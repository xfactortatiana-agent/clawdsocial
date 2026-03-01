"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft,
  Check,
  X,
  Zap,
  Crown,
  Sparkles,
  CreditCard,
  Loader2
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { PLANS, PlanId } from "@/lib/stripe";

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanId>('FREE');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const res = await fetch('/api/user/plan');
      if (res.ok) {
        const data = await res.json();
        setCurrentPlan(data.plan);
      }
    } catch (err) {
      console.error('Failed to fetch plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === 'FREE') return;
    
    setIsCheckingOut(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setIsCheckingOut(null);
    }
  };

  const plans = [
    { ...PLANS.FREE, key: 'FREE' as const },
    { ...PLANS.ESSENTIAL, key: 'ESSENTIAL' as const },
    { ...PLANS.PREMIUM, key: 'PREMIUM' as const },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            
            <span className="font-bold text-xl text-white">Billing</span>
          </div>
          
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, transparent pricing</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            const isPopular = plan.key === 'ESSENTIAL';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 ${
                  isCurrent
                    ? 'bg-violet-600/20 border-2 border-violet-500'
                    : isPopular
                    ? 'bg-slate-900/80 border-2 border-violet-500/50'
                    : 'bg-slate-900/50 border border-slate-800'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-violet-600 text-white text-sm font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    {plan.id === 'FREE' && <Sparkles className="w-6 h-6 text-slate-400" />}
                    {plan.id === 'ESSENTIAL' && <Zap className="w-6 h-6 text-violet-400" />}
                    {plan.id === 'PREMIUM' && <Crown className="w-6 h-6 text-amber-400" />}
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>
                  
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-400">/month</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={isCurrent || isCheckingOut === plan.key}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    isCurrent
                      ? 'bg-emerald-600/20 text-emerald-400 cursor-default'
                      : plan.id === 'FREE'
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20'
                  }`}
                >
                  {isCheckingOut === plan.key ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.id === 'FREE' ? (
                    'Get Started Free'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {[
              {
                q: 'Can I change plans anytime?',
                a: 'Yes! Upgrade or downgrade at any time. Changes take effect immediately.',
              },
              {
                q: 'What happens if I hit my limit?',
                a: "We'll notify you when you're close to your limit. You can upgrade instantly to keep posting.",
              },
              {
                q: 'Is there a free trial?',
                a: 'The Free plan is your trial. Use it as long as you like, upgrade when you need more.',
              },
              {
                q: 'How do I cancel?',
                a: 'Cancel anytime from this page. You\'ll keep access until the end of your billing period.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
