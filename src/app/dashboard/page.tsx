"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Plus, 
  BarChart3, 
  Clock,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Repeat,
  Eye,
  ChevronRight,
  Sparkles,
  Send,
  MoreHorizontal,
  X,
  CreditCard,
  Edit2,
  Trash2
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { format, isToday, isTomorrow } from "date-fns";
import { EliteComposerModal as ComposerModal } from "@/components/composer/EliteComposerModal";
import { UsageWidget } from "@/components/billing/UsageWidget";

interface Post {
  id: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: Date;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  platform: string;
  likes?: number;
  replies?: number;
  reposts?: number;
  impressions?: number;
  mediaUrls?: string[];
}

// Parse content with formatting to React elements
function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null;
  
  // Split by patterns: **bold**, *italic*, `code`, #hashtag, @mention, https://links
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|#[\w]+|@[\w]+|https?:\/\/[^\s]+)/g);
  
  return parts.map((part, i) => {
    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i} className="italic text-slate-200">{part.slice(1, -1)}</em>;
    }
    // Code: `text`
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-slate-700 rounded text-sm font-mono text-cyan-400">{part.slice(1, -1)}</code>;
    }
    // Hashtag: #word
    if (part.startsWith('#') && part.length > 1) {
      return <span key={i} className="text-violet-400">{part}</span>;
    }
    // Mention: @word
    if (part.startsWith('@') && part.length > 1) {
      return <span key={i} className="text-blue-400">{part}</span>;
    }
    // Link: https://
    if (part.startsWith('http')) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          {part.length > 30 ? part.slice(0, 30) + '...' : part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [postsRes, analyticsRes, accountsRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/analytics'),
        fetch('/api/accounts')
      ]);

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts((postsData.posts || []).map((p: any) => ({
          ...p,
          status: p.status?.toLowerCase() || 'draft',
        })));
      }
      
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
      }
      
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setConnectedAccounts(accountsData.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const xAccount = connectedAccounts.find((a: any) => a.platform === 'X');
  
  // Get upcoming posts (scheduled for future)
  const upcomingPosts = posts
    .filter((p: Post) => p.status === 'scheduled' && p.scheduledFor && new Date(p.scheduledFor) > new Date())
    .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
    .slice(0, 5);

  // Get recent published posts
  const recentPosts = posts
    .filter((p: Post) => p.status === 'published')
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
    .slice(0, 5);

  // Get drafts
  const drafts = posts.filter((p: Post) => p.status === 'draft').slice(0, 3);

  // Calculate stats
  const totalPosts = posts.filter(p => p.status === 'published').length;
  const scheduledCount = upcomingPosts.length;
  const draftCount = drafts.length;

  // Delete post function
  const deletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        setActiveMenu(null);
        setDeletingPost(null);
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  // Edit post function
  const editPost = (post: Post) => {
    setEditingPost({
      ...post,
      media: (post.mediaUrls || []).map((url: string) => ({
        url,
        type: url.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image'
      }))
    } as any);
    setShowComposer(true);
    setActiveMenu(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white hidden sm:block">ClawdSocial</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {xAccount && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm text-emerald-400">@{xAccount.accountHandle}</span>
              </div>
            )}

            <Link
              href="/billing"
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Billing</span>
            </Link>
            
            <button 
              onClick={() => setShowComposer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-600/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Post</span>
            </button>
            
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Manage your content and track performance</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={Send}
            label="Published"
            value={totalPosts.toString()}
            trend="+12%"
            color="violet"
          />
          <StatCard 
            icon={Clock}
            label="Scheduled"
            value={scheduledCount.toString()}
            color="amber"
          />
          <StatCard 
            icon={Sparkles}
            label="Drafts"
            value={draftCount.toString()}
            color="cyan"
          />
          <StatCard 
            icon={Users}
            label="Followers"
            value={analytics?.currentFollowers?.toLocaleString() || xAccount?.followerCount?.toLocaleString() || '0'}
            trend={analytics?.followersChange ? `${analytics.followersChange > 0 ? '+' : ''}${analytics.followersChange}%` : undefined}
            color="emerald"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Calendar & Upcoming */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Calendar View */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-violet-400" />
                  <h2 className="font-semibold text-white">Upcoming Posts</h2>
                </div>
                <Link href="/calendar" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
                  View Calendar
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="divide-y divide-slate-800">
                {upcomingPosts.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 mb-2">No upcoming posts</p>
                    <button 
                      onClick={() => setShowComposer(true)}
                      className="text-violet-400 hover:text-violet-300 text-sm"
                    >
                      Schedule your first post
                    </button>
                  </div>
                ) : (
                  upcomingPosts.map((post) => (
                    <div key={post.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-14 text-center">
                          <p className="text-2xl font-bold text-white">
                            {post.scheduledFor ? format(new Date(post.scheduledFor), 'd') : '-'}
                          </p>
                          <p className="text-xs text-slate-500 uppercase">
                            {post.scheduledFor ? format(new Date(post.scheduledFor), 'MMM') : ''}
                          </p>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-sm line-clamp-2 mb-2">{renderFormattedText(post.content)}</p>
                          
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {post.scheduledFor ? format(new Date(post.scheduledFor), 'h:mm a') : ''}
                            </span>
                            <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">
                              {post.platform === 'X' ? '𝕏' : post.platform}
                            </span>
                            
                            {post.scheduledFor && isToday(new Date(post.scheduledFor)) && (
                              <span className="text-emerald-400">Today</span>
                            )}
                            {post.scheduledFor && isTomorrow(new Date(post.scheduledFor)) && (
                              <span className="text-amber-400">Tomorrow</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-500"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          {activeMenu === post.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveMenu(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1">
                                <button
                                  onClick={() => editPost(post)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingPost(post.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-rose-400 hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Performance */}
            {recentPosts.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-semibold text-white">Recent Performance</h2>
                  </div>
                  <Link href="/analytics" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
                    View Analytics
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-800">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-sm line-clamp-2 mb-3">{renderFormattedText(post.content)}</p>
                          
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1 text-rose-400">
                              <Heart className="w-3 h-3" />
                              {post.likes || 0}
                            </span>
                            <span className="flex items-center gap-1 text-blue-400">
                              <MessageCircle className="w-3 h-3" />
                              {post.replies || 0}
                            </span>
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Repeat className="w-3 h-3" />
                              {post.reposts || 0}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <Eye className="w-3 h-3" />
                              {(post.impressions || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        <span className="text-xs text-slate-500">
                          {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d') : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions & Drafts */}
          <div className="space-y-8">
            {/* Usage Widget */}
            <UsageWidget />

            {/* Quick Actions */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setShowComposer(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-xl text-violet-300 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New Post</span>
                </button>
                
                <Link 
                  href="/analytics"
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 transition-colors"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>View Analytics</span>
                </Link>
                
                <Link 
                  href="/settings"
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>Connect Accounts</span>
                </Link>
              </div>
            </div>

            {/* Drafts */}
            {drafts.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="font-semibold text-white">Drafts</h2>
                  <span className="text-sm text-slate-500">{drafts.length} saved</span>
                </div>

                <div className="divide-y divide-slate-800">
                  {drafts.map((draft) => (
                    <div 
                      key={draft.id}
                      className="px-6 py-4 hover:bg-slate-800/30 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          onClick={() => editPost(draft)}
                          className="flex-1 cursor-pointer"
                        >
                          <p className="text-slate-300 text-sm line-clamp-2 mb-2">{renderFormattedText(draft.content) || <span className="text-slate-500 italic">Empty draft</span>}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              Edited {format(new Date(draft.updatedAt || draft.createdAt || Date.now()), 'MMM d, h:mm a')}
                            </span>
                            <span className="text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to edit →
                            </span>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(activeMenu === draft.id ? null : draft.id);
                            }}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          {activeMenu === draft.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveMenu(null)}
                              />
                              <div className="absolute right-0 bottom-full mb-1 w-36 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1">
                                <button
                                  onClick={() => editPost(draft)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingPost(draft.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-rose-400 hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Account Card */}
            {xAccount && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  {xAccount.profileImageUrl ? (
                    <img 
                      src={xAccount.profileImageUrl} 
                      alt={xAccount.accountHandle}
                      className="w-14 h-14 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center">
                      <span className="text-2xl">𝕏</span>
                    </div>
                  )}
                  
                  <div>
                    <p className="font-semibold text-white">@{xAccount.accountHandle}</p>
                    <p className="text-sm text-emerald-400">✓ Connected</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Composer Modal */}
      <ComposerModal
        isOpen={showComposer}
        onClose={() => {
          setShowComposer(false);
          setEditingPost(null);
          fetchDashboardData();
        }}
        initialDate={editingPost?.scheduledFor}
        connectedAccounts={connectedAccounts}
        editingPost={editingPost}
        analytics={analytics}
      />

      {/* Delete Confirmation Modal */}
      {deletingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDeletingPost(null)} />
          
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Post?</h3>
            <p className="text-slate-400 text-center text-sm mb-6">
              This action cannot be undone. The post will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingPost(null)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePost(deletingPost)}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color 
}: { 
  icon: any; 
  label: string; 
  value: string;
  trend?: string;
  color: 'violet' | 'amber' | 'cyan' | 'emerald';
}) {
  const colors = {
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-500/20',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20',
    cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-500/20',
    emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
  };

  const iconColors = {
    violet: 'text-violet-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        {trend && (
          <span className="text-xs text-emerald-400 font-medium">{trend}</span>
        )}
      </div>
      
      <p className="text-3xl font-bold text-white mt-3">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}
