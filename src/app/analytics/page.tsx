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
  Zap,
  Info,
  ArrowUpRight
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { format, subDays, parseISO, isValid } from "date-fns";

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

interface TrendPoint {
  date: string;
  rate: number;
  impressions: number;
  engagements: number;
  posts: number;
  x?: number;
  y?: number;
}

interface BestTimeDetail {
  time: string;
  engagementRate: number;
  postsCount: number;
  avgImpressions: number;
}

interface Analytics {
  impressions: number;
  impressionsChange: number;
  engagements: number;
  engagementsChange: number;
  followersGained: number;
  followersChange: number;
  currentFollowers: number;
  profileClicks: number;
  profileClicksChange: number;
  topPosts: Post[];
  bestDay: string;
  bestDayDetails: { day: string; rate: number; posts: number }[];
  bestTime: string;
  bestTimeDetails: BestTimeDetail[];
  engagementTrend: TrendPoint[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<30 | 7 | 90>(30);
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    const insights = [];
    
    if (data.engagementsChange > 20) {
      insights.push("🔥 Your engagement is surging! Double down on what's working.");
    } else if (data.engagementsChange < -15) {
      insights.push("📉 Engagement dip detected. Try posting more threads with questions.");
    }
    
    if (data.bestTime && data.bestDay) {
      insights.push(`💡 Post on ${data.bestDay}s at ${data.bestTime} for maximum reach.`);
    }
    
    if (data.topPosts[0]?.engagementRate > 5) {
      insights.push("⭐ Your top post had exceptional engagement. Study what made it work!");
    }
    
    if (data.followersChange > 10) {
      insights.push("🚀 Follower growth accelerating! You're gaining momentum.");
    }
    
    setAiInsight(insights[0] || "Keep posting consistently to build your audience.");
  };

  // Chart calculations
  const chartData = useMemo(() => {
    if (!analytics?.engagementTrend?.length) return null;
    
    const data = analytics.engagementTrend;
    const maxRate = Math.max(...data.map(d => d.rate), 1);
    const minRate = Math.min(...data.map(d => d.rate), 0);
    const range = maxRate - minRate || 1;
    
    const width = 800;
    const height = 200;
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const points = data.map((point, i) => ({
      ...point,
      x: padding.left + (i / (data.length - 1 || 1)) * chartWidth,
      y: padding.top + chartHeight - ((point.rate - minRate) / range) * chartHeight
    }));
    
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Area path for gradient fill
    const areaPath = `${path} L ${points[points.length - 1]?.x || width} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;
    
    return { points, path, areaPath, width, height, padding, maxRate, minRate };
  }, [analytics]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartData) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x: e.clientX, y: e.clientY });
    
    // Find nearest point
    const nearest = chartData.points.reduce((closest, point) => {
      const dist = Math.abs(point.x - x);
      return dist < Math.abs(closest.x - x) ? point : closest;
    }, chartData.points[0]);
    
    if (nearest && Math.abs(nearest.x - x) < 30) {
      setHoveredPoint(nearest);
    } else {
      setHoveredPoint(null);
    }
  };

  const StatCard = ({ 
    label, 
    value, 
    change, 
    subValue,
    icon: Icon,
    color,
    trend
  }: { 
    label: string; 
    value: string; 
    change: number; 
    subValue?: string;
    icon: any;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`
        }>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {change !== 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
            change > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      <p className="text-3xl font-bold text-white mt-4">{value}</p>
      {subValue && <p className="text-sm text-slate-500 mt-1">{subValue}</p>}
      <p className="text-sm text-slate-400 mt-2">{label}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading analytics...</div>
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
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Analytics</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-slate-800 rounded-lg">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeRange(days as any)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    timeRange === days 
                      ? 'bg-violet-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Coach */}
        <div className="mb-8 p-6 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-cyan-600/20 border border-violet-500/30 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-violet-300 font-medium mb-1">🎯 AI Coach Insight</p>
              <p className="text-lg text-white">{aiInsight}</p>            </div>
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
            label="Total Followers"
            value={analytics?.currentFollowers?.toLocaleString() || "0"}
            subValue={`+${analytics?.followersGained || 0} this period`}
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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Engagement Trend Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">Engagement Rate Trend</h3>
                </div>
                
                {hoveredPoint && (
                  <div className="text-sm text-slate-400">
                    {format(parseISO(hoveredPoint.date), 'MMM d')}: {' '}
                    <span className="text-emerald-400 font-medium">
                      {hoveredPoint.rate.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              
              {chartData ? (
                <div className="relative">
                  <svg 
                    viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                    className="w-full h-64 cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={i}
                        x1={chartData.padding.left}
                        y1={chartData.padding.top + (i / 4) * (chartData.height - chartData.padding.top - chartData.padding.bottom)}
                        x2={chartData.width - chartData.padding.right}
                        y2={chartData.padding.top + (i / 4) * (chartData.height - chartData.padding.top - chartData.padding.bottom)}
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    ))}
                    
                    {/* Area fill */}
                    <path
                      d={chartData.areaPath}
                      fill="url(#chartGradient)"
                    />
                    
                    {/* Line */}
                    <path
                      d={chartData.path}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Data points */}
                    {chartData.points.map((point, i) => (
                      <circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r={hoveredPoint?.date === point.date ? 6 : 3}
                        fill={hoveredPoint?.date === point.date ? "#8b5cf6" : "#1e293b"}
                        stroke="#8b5cf6"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                    ))}
                    
                    {/* Hover line */}
                    {hoveredPoint && (
                      <line
                        x1={hoveredPoint.x}
                        y1={chartData.padding.top}
                        x2={hoveredPoint.x}
                        y2={chartData.height - chartData.padding.bottom}
                        stroke="#8b5cf6"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity="0.5"
                      />
                    )}
                  </svg>
                  
                  {/* X-axis labels */}
                  <div className="flex justify-between px-12 mt-2 text-xs text-slate-500">
                    <span>{format(subDays(new Date(), timeRange), 'MMM d')}</span>
                    <span>Today</span>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  Not enough data yet. Post more to see trends!
                </div>
              )}
            </div>

            {/* Top Posts */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Top Performing Posts</h3>
                <Link href="/calendar" className="text-sm text-violet-400 hover:text-violet-300">
                  View all →
                </Link>
              </div>

              <div className="space-y-4">
                {analytics?.topPosts?.slice(0, 5).map((post, idx) => (
                  <div 
                    key={post.id}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">#{idx + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-sm line-clamp-2 mb-3">{post.content}</p>
                        
                        <div className="flex items-center gap-4 text-sm flex-wrap">
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
                          
                          <div className="ml-auto px-3 py-1 bg-violet-500/20 rounded-full">
                            <span className="text-violet-400 font-medium text-sm">
                              {(post.engagementRate || 0).toFixed(1)}% ER
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Best Time to Post */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold text-white">Best Time to Post</h3>
              </div>
              
              {analytics?.bestTime ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-xl border border-violet-500/30">
                    <p className="text-3xl font-bold text-white">{analytics.bestTime}</p>
                    <p className="text-sm text-violet-300 mt-1">Optimal posting time</p>
                  </div>
                  
                  {analytics.bestDay && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-white font-medium">{analytics.bestDay}s</p>
                        <p className="text-xs text-emerald-400">Best day of week</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Time breakdown */}
                  {analytics.bestTimeDetails && analytics.bestTimeDetails.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-xs text-slate-500 mb-3">Performance by time slot:</p>
                      <div className="space-y-2">
                        {analytics.bestTimeDetails.slice(0, 5).map((time) => (
                          <div key={time.time} className="flex items-center justify-between text-sm">
                            <span className={time.time === analytics.bestTime ? 'text-white font-medium' : 'text-slate-400'}>
                              {time.time}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-violet-500 rounded-full"
                                  style={{ width: `${Math.min((time.engagementRate / (analytics.bestTimeDetails?.[0]?.engagementRate || 1)) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-12 text-right">
                                {time.engagementRate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Post more to discover your optimal times</p>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Pro Tips</h3>
              </div>
              
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">💡</span>
                  <span>Posts with images get 2x more engagement than text-only</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">🧵</span>
                  <span>Threads perform 40% better on weekdays vs weekends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">❓</span>
                  <span>Questions in your first tweet boost replies by 3x</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">⏰</span>
                  <span>Consistency matters more than perfect timing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Hover Tooltip */}
      {hoveredPoint && (
        <div 
          className="fixed z-50 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl pointer-events-none"
          style={{ 
            left: mousePos.x + 10, 
            top: mousePos.y - 80,
          }}
        >
          <p className="text-xs text-slate-400 mb-1">{format(parseISO(hoveredPoint.date), 'MMM d, yyyy')}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-slate-400">Engagement Rate: </span>
              <span className="text-emerald-400 font-medium">{hoveredPoint.rate.toFixed(2)}%</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Impressions: </span>
              <span className="text-white">{hoveredPoint.impressions.toLocaleString()}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Posts: </span>
              <span className="text-white">{hoveredPoint.posts}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
