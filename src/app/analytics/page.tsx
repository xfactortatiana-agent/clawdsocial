"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { 
  BarChart3, 
  Heart, 
  MessageCircle, 
  Repeat, 
  Eye, 
  Users,
  TrendingUp,
  Calendar,
  Send,
  Reply
} from "lucide-react";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [postsData, setPostsData] = useState<any[]>([]);
  const [repliesData, setRepliesData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        
        // Fetch posts and replies separately
        const postsRes = await fetch('/api/posts');
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          const allPosts = postsData.posts || [];
          
          // Separate posts and replies based on content analysis
          // Posts start with regular text, replies start with @
          const posts = allPosts.filter((p: any) => 
            p.status === 'PUBLISHED' && !p.content?.startsWith('@')
          );
          const replies = allPosts.filter((p: any) => 
            p.status === 'PUBLISHED' && p.content?.startsWith('@')
          );
          
          setPostsData(posts);
          setRepliesData(replies);
        }
      } else {
        setError('Failed to load analytics');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-slate-400">No analytics available. Connect your X account to see data.</p>
            <Link 
              href="/settings" 
              className="inline-block mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Go to Settings
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { account, overview } = analytics;

  // Calculate stats for posts vs replies
  const postStats = {
    count: postsData.length,
    likes: postsData.reduce((sum, p) => sum + (p.likes || 0), 0),
    replies: postsData.reduce((sum, p) => sum + (p.replies || 0), 0),
    reposts: postsData.reduce((sum, p) => sum + (p.reposts || 0), 0),
    impressions: postsData.reduce((sum, p) => sum + (p.impressions || 0), 0),
  };

  const replyStats = {
    count: repliesData.length,
    likes: repliesData.reduce((sum, p) => sum + (p.likes || 0), 0),
    replies: repliesData.reduce((sum, p) => sum + (p.replies || 0), 0),
    reposts: repliesData.reduce((sum, p) => sum + (p.reposts || 0), 0),
    impressions: repliesData.reduce((sum, p) => sum + (p.impressions || 0), 0),
  };

  const activeData = activeTab === 'posts' ? postsData : repliesData;
  const activeStats = activeTab === 'posts' ? postStats : replyStats;

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-slate-400">Track your social media performance</p>
        </div>

        {/* Account Info */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            {account.profileImageUrl ? (
              <img 
                src={account.profileImageUrl} 
                alt={account.handle}
                className="w-16 h-16 rounded-full object-cover" 
              />
            ) : (
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                <span className="text-2xl">𝕏</span>
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-white">@{account.handle}</p>
              <p className="text-sm text-slate-400">
                Connected {new Date(account.connectedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Followers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={Users} 
            label="Followers" 
            value={account.followerCount.toLocaleString()} 
          />
          <StatCard 
            icon={Send} 
            label="Posts" 
            value={postStats.count.toString()} 
          />
          <StatCard 
            icon={Reply} 
            label="Replies" 
            value={replyStats.count.toString()} 
          />
          <StatCard 
            icon={BarChart3} 
            label="Engagement Rate" 
            value={overview.engagementRate} 
          />
        </div>

        {/* Posts vs Replies Toggle */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mb-8">
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                activeTab === 'posts' 
                  ? 'bg-violet-600/20 text-violet-300 border-b-2 border-violet-500' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              Posts ({postStats.count})
            </button>
            <button
              onClick={() => setActiveTab('replies')}
              className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                activeTab === 'replies' 
                  ? 'bg-violet-600/20 text-violet-300 border-b-2 border-violet-500' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Reply className="w-4 h-4" />
              Replies ({replyStats.count})
            </button>
          </div>

          {/* Stats for active tab */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={Heart} 
                label="Likes" 
                value={activeStats.likes.toLocaleString()} 
                color="text-rose-400"
              />
              <StatCard 
                icon={MessageCircle} 
                label="Replies" 
                value={activeStats.replies.toLocaleString()} 
                color="text-blue-400"
              />
              <StatCard 
                icon={Repeat} 
                label="Reposts" 
                value={activeStats.reposts.toLocaleString()} 
                color="text-emerald-400"
              />
              <StatCard 
                icon={Eye} 
                label="Impressions" 
                value={activeStats.impressions.toLocaleString()} 
                color="text-violet-400"
              />
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">
              {activeTab === 'posts' ? 'Recent Posts' : 'Recent Replies'}
            </h2>
            <span className="text-sm text-slate-500">
              {activeData.length} total
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {activeData.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500">
                No {activeTab} found. {<a href="/dashboard" className="text-violet-400 hover:underline">Create your first post</a>}
              </div>
            ) : (
              activeData.slice(0, 20).map((post: any) => (
                <div key={post.id} className="px-6 py-4">
                  <p className="text-slate-300 text-sm mb-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{post.publishedAt && new Date(post.publishedAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {post.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {post.replies || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3 h-3" /> {post.reposts || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {(post.impressions || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-slate-900/50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">ClawdSocial</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">Calendar</Link>
          <Link href="/analytics" className="text-sm text-white">Analytics</Link>
          <Link href="/settings" className="text-sm text-slate-400 hover:text-white">Settings</Link>
        </nav>

        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color = "text-slate-400" 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  color?: string;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
