"use client";

import { VisualCalendar } from "@/components/calendar/VisualCalendar";
import { ComposerModal } from "@/components/composer/ComposerModal";
import { useState } from "react";

// Mock data for demo
const mockPosts = [
  {
    id: "1",
    content: "Launching something new today! 🚀",
    platform: "x" as const,
    status: "scheduled" as const,
    scheduledFor: new Date(2025, 1, 15, 10, 0),
    accountName: "@clawdcorp",
  },
  {
    id: "2",
    content: "Behind the scenes of our AI workflow",
    platform: "instagram" as const,
    status: "draft" as const,
    scheduledFor: new Date(2025, 1, 15, 14, 0),
    accountName: "@clawdcorp",
  },
  {
    id: "3",
    content: "How we ship 10x faster with agents",
    platform: "linkedin" as const,
    status: "published" as const,
    scheduledFor: new Date(2025, 1, 10, 9, 0),
    accountName: "@clawdcorp",
  },
  {
    id: "4",
    content: "TikTok trend analysis thread",
    platform: "tiktok" as const,
    status: "scheduled" as const,
    scheduledFor: new Date(2025, 1, 20, 16, 0),
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-slate-900">ClawdSocial</span>
          </div>

          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-slate-900">Calendar</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">Posts</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">Analytics</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">Settings</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleNewPost}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
            >
              New Post
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Content Calendar</h1>
          <p className="text-slate-600">Schedule and manage your social media posts</p>
        </div>

        <VisualCalendar
          posts={mockPosts}
          onDateClick={handleDateClick}
          onPostClick={(post) => {
            console.log("Clicked post:", post);
          }}
        />
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
