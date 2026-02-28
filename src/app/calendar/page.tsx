"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  AlertCircle,
  GripVertical,
  LayoutGrid,
  List,
  Sparkles,
  Filter
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek,
  addDays,
  isBefore,
  isAfter,
  differenceInDays,
  startOfDay
} from "date-fns";
import { ComposerModal } from "@/components/composer/ComposerModal";

interface Post {
  id: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: Date;
  publishedAt?: Date;
  platform: string;
  mediaCount?: number;
}

interface GapWarning {
  start: Date;
  end: Date;
  days: number;
}

const statusColors = {
  draft: { bg: 'bg-slate-700', border: 'border-slate-600', text: 'text-slate-300', label: 'Draft' },
  scheduled: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Scheduled' },
  published: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Published' },
  failed: { bg: 'bg-rose-500/20', border: 'border-rose-500/30', text: 'text-rose-400', label: 'Failed' },
};

const optimalTimes = ['09:00', '12:00', '15:00', '18:00', '21:00'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [posts, setPosts] = useState<Post[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [draggedPost, setDraggedPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all');
  const [showQueueModal, setShowQueueModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, accountsRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/accounts')
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts?.map((p: any) => ({
          ...p,
          scheduledFor: p.scheduledFor ? new Date(p.scheduledFor) : undefined,
          publishedAt: p.publishedAt ? new Date(p.publishedAt) : undefined,
        })) || []);
      }
      
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setConnectedAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get posts for a specific day
  const getPostsForDay = (day: Date) => {
    return posts.filter(post => {
      const postDate = post.scheduledFor || post.publishedAt;
      if (!postDate) return false;
      return (
        postDate.getDate() === day.getDate() &&
        postDate.getMonth() === day.getMonth() &&
        postDate.getFullYear() === day.getFullYear()
      );
    }).filter(post => filter === 'all' || post.status === filter);
  };

  // Find post gaps (3+ days with no posts)
  const gapWarnings = useMemo(() => {
    const warnings: GapWarning[] = [];
    const scheduledPosts = posts
      .filter(p => p.status === 'scheduled' && p.scheduledFor)
      .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());
    
    if (scheduledPosts.length === 0) return warnings;

    // Check from today to first scheduled post
    const today = startOfDay(new Date());
    const firstPost = scheduledPosts[0];
    if (firstPost.scheduledFor && isBefore(today, firstPost.scheduledFor)) {
      const days = differenceInDays(firstPost.scheduledFor, today);
      if (days >= 3) {
        warnings.push({ start: today, end: firstPost.scheduledFor, days });
      }
    }

    // Check gaps between scheduled posts
    for (let i = 0; i < scheduledPosts.length - 1; i++) {
      const current = scheduledPosts[i];
      const next = scheduledPosts[i + 1];
      if (current.scheduledFor && next.scheduledFor) {
        const gap = differenceInDays(next.scheduledFor, current.scheduledFor);
        if (gap >= 3) {
          warnings.push({ start: current.scheduledFor, end: next.scheduledFor, days: gap });
        }
      }
    }

    return warnings;
  }, [posts]);

  // Get next optimal time slot for queue
  const getNextQueueSlot = () => {
    const now = new Date();
    const scheduledTimes = posts
      .filter(p => p.status === 'scheduled' && p.scheduledFor)
      .map(p => new Date(p.scheduledFor!).getTime());

    // Start from tomorrow
    let checkDate = addDays(startOfDay(now), 1);
    
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      for (const time of optimalTimes) {
        const [hours, minutes] = time.split(':');
        const slot = new Date(checkDate);
        slot.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Check if slot is taken
        const slotTime = slot.getTime();
        const isTaken = scheduledTimes.some(t => {
          const diff = Math.abs(t - slotTime);
          return diff < 1000 * 60 * 60; // Within 1 hour
        });
        
        if (!isTaken && isAfter(slot, now)) {
          return slot;
        }
      }
      checkDate = addDays(checkDate, 1);
    }
    
    return null;
  };

  // Handle drag and drop
  const handleDragStart = (post: Post) => {
    setDraggedPost(post);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    if (!draggedPost || draggedPost.status !== 'scheduled') return;

    // Optimistic update
    const newDate = new Date(day);
    if (draggedPost.scheduledFor) {
      newDate.setHours(
        draggedPost.scheduledFor.getHours(),
        draggedPost.scheduledFor.getMinutes()
      );
    }

    setPosts(posts.map(p => 
      p.id === draggedPost.id 
        ? { ...p, scheduledFor: newDate }
        : p
    ));

    // API call in background
    try {
      await fetch(`/api/posts/${draggedPost.id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: newDate.toISOString() })
      });
    } catch (err) {
      console.error('Failed to reschedule:', err);
      // Revert on error
      fetchData();
    }

    setDraggedPost(null);
  };

  // Calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = viewMode === 'month' 
    ? eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    : eachDayOfInterval({ 
        start: startOfWeek(currentDate), 
        end: endOfWeek(currentDate) 
      });

  const nextSlot = getNextQueueSlot();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading calendar...</div>
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
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Calendar</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center p-1 bg-slate-800 rounded-lg">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'month' 
                    ? 'bg-violet-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'week' 
                    ? 'bg-violet-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Queue */}
            {nextSlot && (
              <button
                onClick={() => setShowQueueModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-sm font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Queue
              </button>
            )}

            <button 
              onClick={() => {
                setEditingPost(null);
                setShowComposer(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-600/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </button>
            
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gap Warnings */}
        {gapWarnings.length > 0 && (
          <div className="mb-6 space-y-3">
            {gapWarnings.map((gap, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-400">
                    <span className="font-medium">{gap.days} day gap</span> from{' '}
                    {format(gap.start, 'MMM d')} to {format(gap.end, 'MMM d')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Fill gap with suggested posts
                    const middle = new Date((gap.start.getTime() + gap.end.getTime()) / 2);
                    setEditingPost({
                      id: 'new',
                      content: '',
                      status: 'draft',
                      scheduledFor: middle,
                      platform: 'X'
                    });
                    setShowComposer(true);
                  }}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Fill Gap
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">{format(currentDate, 'MMMM yyyy')}</h1>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : addDays(currentDate, -7))}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Today
              </button>
              
              <button
                onClick={() => setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, 7))}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none"
            >
              <option value="all">All Posts</option>
              <option value="draft">Drafts</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-6 text-sm">
          {Object.entries(statusColors).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
              <span className="text-slate-400">{colors.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-4 py-3 text-center">
                <span className="text-sm font-medium text-slate-400">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayPosts = getPostsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isDragTarget = draggedPost && draggedPost.status === 'scheduled';

              return (
                <div
                  key={idx}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                  onClick={() => {
                    if (dayPosts.length === 0) {
                      setEditingPost({
                        id: 'new',
                        content: '',
                        status: 'draft',
                        scheduledFor: day,
                        platform: 'X'
                      });
                      setShowComposer(true);
                    }
                  }}
                  className={`min-h-[140px] p-3 border-b border-r border-slate-800 transition-colors ${
                    !isCurrentMonth ? 'bg-slate-900/30' : ''
                  } ${isDragTarget ? 'hover:bg-violet-500/10' : 'hover:bg-slate-800/30 cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      isTodayDate 
                        ? 'w-7 h-7 bg-violet-600 text-white rounded-full flex items-center justify-center' 
                        : isCurrentMonth 
                          ? 'text-slate-300' 
                          : 'text-slate-600'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    
                    {dayPosts.length > 0 && (
                      <span className="text-xs text-slate-500">{dayPosts.length}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        draggable={post.status === 'scheduled'}
                        onDragStart={() => handleDragStart(post)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPost(post);
                          setShowComposer(true);
                        }}
                        className={`px-2.5 py-2 rounded-lg text-xs cursor-pointer group transition-all ${
                          statusColors[post.status].bg
                        } ${statusColors[post.status].border} border hover:opacity-80`}
                      >
                        <div className="flex items-start gap-1.5">
                          {post.status === 'scheduled' && (
                            <GripVertical className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`truncate ${statusColors[post.status].text}`}>
                              {post.content.slice(0, 40)}{post.content.length > 40 && '...'}
                            </p>                            
                            {post.scheduledFor && post.status === 'scheduled' && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {format(new Date(post.scheduledFor), 'h:mm a')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Composer Modal */}
      <ComposerModal
        isOpen={showComposer}
        onClose={() => {
          setShowComposer(false);
          setEditingPost(null);
          fetchData();
        }}
        initialDate={editingPost?.scheduledFor}
        connectedAccounts={connectedAccounts}
        editingPost={editingPost}
      />
    </div>
  );
}
