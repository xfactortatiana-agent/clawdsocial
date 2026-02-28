"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Repeat,
  MousePointer,
  Sparkles,
  Calendar,
  Clock,
  ChevronRight,
  BarChart3,
  Zap
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { format, subDays, startOfDay, parseISO } from "date-fns";

interface Post {
  id: string;
  content: string;
  publishedAt: string;
  impressions: number;
  engagements: number;
  likes: number;
  replies: number;
  reposts: number;
  clicks: number;
  engagementRate: number;
}

interface Analytics {
  impressions: number;
  impressionsChange: number;
  engagements: number;
  engagementsChange: number;
  followersGained: number;
  followersChange: number;
  profileClicks: number;
  profileClicksChange: number;
  topPosts: Post[];
  bestDay: string;
  bestTime: string;
  engagementTrend: { date: string; rate: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<30 | 7>(30);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics?days=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        generateAIInsight(data.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsight = (data: Analytics) => {
    // Simple rule-based insights (can be replaced with AI API call)
    const insights = [];
    
    if (data.engagementsChange > 20) {
      insights.push("Your engagement is trending up! Keep posting consistently.");
    } else if (data.engagementsChange < -10) {
      insights.push("Engagement is down. Try posting more threads or asking questions.");
    }
    
    if (data.topPosts[0]?.content.includes('?')) {
      insights.push("Posts with questions get 2.3x more replies. Keep asking!");
    }
    
    if (data.bestDay) {
      insights.push(`Your best day is ${data.bestDay}. Schedule your best content then.`);
    }
    
    if (data.engagementTrend[data.engagementTrend.length - 1]?.rate > 5) {
      insights.push("Your engagement rate is above average. You're doing great!");
    }
    
    setAiInsight(insights[0] || "Keep posting consistently to build momentum.");
  };

  // Generate trend line SVG path
  const trendPath = useMemo(() => {
    if (!analytics?.engagementTrend?.length) return "";
    
    const data = analytics.engagementTrend;
    const max = Math.max(...data.map(d => d.rate));
    const min = Math.min(...data.map(d => d.rate));
    const range = max - min || 1;
    
    const width = 100;
    const height = 40;
    
    return data.map((point, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((point.rate - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  const StatCard = ({ 
    label, 
    value, 
    change, 
    icon: Icon,
    color 
  }: { 
    label: string; 
    value: string; 
    change: number; 
    icon: any;
    color: string;
  }) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`
        }>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {change !== 0 && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            change > 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      <p className="text-3xl font-bold text-white mt-4">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );

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
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Analytics</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Toggle */}
            <div className="flex items-center p-1 bg-slate-800 rounded-lg">
              <button
                onClick={() => setTimeRange(7)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  timeRange === 7 
                    ? 'bg-violet-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7 days
              </button>
              <button
                onClick={() => setTimeRange(30)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  timeRange === 30 
                    ? 'bg-violet-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                30 days
              </button>
            </div>

            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Coach Insight */}
        <div className="mb-8 p-6 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-violet-300 font-medium mb-1">What's Working</p>
              <p className="text-lg text-white">{aiInsight}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Impressions"
            value={analytics?.impressions?.toLocaleString() || "0"}
            change={analytics?.impressionsChange || 0}
            icon={Eye}
            color="bg-blue-600"
          />
          
          <StatCard
            label="Engagements"
            value={analytics?.engagements?.toLocaleString() || "0"}
            change={analytics?.engagementsChange || 0}
            icon={Heart}
            color="bg-rose-600"
          />
          
          <StatCard
            label="Followers Gained"
            value={`+${analytics?.followersGained || 0}`}
            change={analytics?.followersChange || 0}
            icon={Users}
            color="bg-emerald-600"
          />
          
          <StatCard
            label="Profile Clicks"
            value={analytics?.profileClicks?.toLocaleString() || "0"}
            change={analytics?.profileClicksChange || 0}
            icon={MousePointer}
            color="bg-amber-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Posts */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Top Performing Posts</h2>
              <Link 
                href="/calendar" 
                className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {analytics?.topPosts?.slice(0, 5).map((post, idx) => (
                <div 
                  key={post.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">#{idx + 1}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-sm line-clamp-2 mb-3">{post.content}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Eye className="w-4 h-4" />
                          {post.impressions?.toLocaleString()}
                        </span>
                        
                        <span className="flex items-center gap-1.5 text-rose-400">
                          <Heart className="w-4 h-4" />
                          {post.likes}
                        </span>
                        
                        <span className="flex items-center gap-1.5 text-blue-400">
                          <MessageCircle className="w-4 h-4" />
                          {post.replies}
                        </span>
                        
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <Repeat className="w-4 h-4" />
                          {post.reposts}
                        </span>
                        
                        <span className="ml-auto text-violet-400 font-medium">
                          {(post.engagementRate || 0).toFixed(1)}% ER
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!analytics?.topPosts || analytics.topPosts.length === 0) && (
                <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <p className="text-slate-400">No posts yet. Start creating! 🚀</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Best Time to Post */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold text-white">Best Time to Post</h3>
              </div>
              
              {analytics?.bestDay && analytics?.bestTime ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{analytics.bestDay}s</p>
                      <p className="text-sm text-slate-400">Best day</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{analytics.bestTime}</p>
                      <p className="text-sm text-slate-400">Best time</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Post more to discover your best times</p>
              )}
            </div>

            {/* Engagement Trend */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Engagement Trend</h3>
              </div>
              
              {analytics?.engagementTrend?.length && analytics.engagementTrend.length > 0 ? (
                <div className="h-24">
                  <svg viewBox="0 0 100 40" className="w-full h-full">
                    <defs>
                      <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    <path
                      d={`${trendPath} L 100 40 L 0 40 Z`}
                      fill="url(#trendGradient)"
                    />
                    
                    <path
                      d={trendPath}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Not enough data yet</p>
              )}
              
              <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                <span>{format(subDays(new Date(), timeRange), 'MMM d')}</span>
                <span>Today</span>
              </div>            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Quick Tips</h3>
              </div>
              
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Posts with images get 2x engagement
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Threads perform best on weekdays
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Ask questions to boost replies
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
