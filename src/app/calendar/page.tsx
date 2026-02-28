"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ComposerModal } from "@/components/composer/ComposerModal";

interface Post {
  id: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: Date;
  platform: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      }
      
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setConnectedAccounts(accountsData.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPostsForDay = (day: Date) => {
    return posts.filter(post => {
      if (!post.scheduledFor) return false;
      const postDate = new Date(post.scheduledFor);
      return (
        postDate.getDate() === day.getDate() &&
        postDate.getMonth() === day.getMonth() &&
        postDate.getFullYear() === day.getFullYear()
      );
    });
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setShowComposer(true);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

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
              <span className="hidden sm:inline">Back to Dashboard</span>
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
            <button 
              onClick={() => {
                setSelectedDate(new Date());
                setShowComposer(true);
              }}
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
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{format(currentDate, 'MMMM yyyy')}</h1>
            <p className="text-slate-400">Schedule and manage your content</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
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
              onClick={nextMonth}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
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

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[120px] p-3 border-b border-r border-slate-800 cursor-pointer transition-colors hover:bg-slate-800/50 ${
                    !isCurrentMonth ? 'bg-slate-900/30' : ''
                  }`}
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
                      <span className="text-xs text-slate-500">{dayPosts.length} posts</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className={`px-2 py-1 rounded text-xs truncate ${
                          post.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : post.status === 'scheduled'
                            ? 'bg-violet-500/20 text-violet-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {post.status === 'scheduled' && <Clock className="w-3 h-3" />}
                          <span className="truncate">{post.content.slice(0, 30)}...</span>
                        </div>
                      </div>
                    ))}
                    
                    {dayPosts.length > 3 && (
                      <div className="text-xs text-slate-500 px-2">+{dayPosts.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500/20" />
            <span className="text-sm text-slate-400">Published</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-violet-500/20" />
            <span className="text-sm text-slate-400">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500/20" />
            <span className="text-sm text-slate-400">Draft</span>
          </div>
        </div>
      </main>

      {/* Composer Modal */}
      <ComposerModal
        isOpen={showComposer}
        onClose={() => {
          setShowComposer(false);
          setSelectedDate(null);
        }}
        initialDate={selectedDate}
        connectedAccounts={connectedAccounts}
      />
    </div>
  );
}
