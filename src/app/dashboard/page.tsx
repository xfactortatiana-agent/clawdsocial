"use client";

import { VisualCalendar } from "@/components/calendar/VisualCalendar";
import { ComposerModal } from "@/components/composer/ComposerModal";
import { useState } from "react";
import Link from "next/link";
import { Calendar, Plus, Settings, BarChart3, FileText } from "lucide-react";

const mockPosts = [
  {
    id: "1",
    content: "Launching something new today! 🚀",
    platform: "x" as const,
    status: "scheduled" as const,
    scheduledFor: new Date(2026, 1, 28, 10, 0),
    accountName: "@clawdcorp",
  },
  {
    id: "2",
    content: "Behind the scenes of our AI workflow",
    platform: "instagram" as const,
    status: "draft" as const,
    scheduledFor: new Date(2026, 1, 28, 14, 0),
    accountName: "@clawdcorp",
  },
  {
    id: "3",
    content: "How we ship 10x faster with agents",
    platform: "linkedin" as const,
    status: "published" as const,
    scheduledFor: new Date(2026, 1, 25, 9, 0),
    accountName: "@clawdcorp",
  },
];

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsComposerOpen(true);
  };

  const handleNewPost = () => {
    setSelectedDate(new Date());
    setIsComposerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900/50 border-r border-slate-800/50 z-40">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">ClawdSocial</span>
          </Link>

          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-violet-600/20 text-violet-300 rounded-xl">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Calendar</span>
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 rounded-xl transition-colors">
              <FileText className="w-5 h-5" />
              <span>Posts</span>
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 rounded-xl transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 rounded-xl transition-colors">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8">
          <div>
            <h1 className="text-xl font-semibold text-white">Content Calendar</h1>
            <p className="text-sm text-slate-400">Schedule and manage your posts</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleNewPost}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full"></div>
          </div>
        </header>

        {/* Calendar */}
        <div className="p-8">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
            <VisualCalendar
              posts={mockPosts}
              onDateClick={handleDateClick}
              onPostClick={(post) => console.log(post)}
            />
          </div>
        </div>
      </main>

      {/* Composer Modal */}
      <ComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        initialDate={selectedDate}
      />
    </div>
  );
}
