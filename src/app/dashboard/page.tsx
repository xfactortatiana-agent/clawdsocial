"use client";

import { VisualCalendar } from "@/components/calendar/VisualCalendar";
import { ComposerModal } from "@/components/composer/ComposerModal";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Plus, Settings, BarChart3, FileText } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

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
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);

  // Fetch connected accounts
  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => {
        setConnectedAccounts(data.accounts || []);
      })
      .catch(err => console.error('Failed to fetch accounts:', err));
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsComposerOpen(true);
  };

  const handleNewPost = () => {
    setSelectedDate(new Date());
    setIsComposerOpen(true);
  };

  const xAccounts = connectedAccounts.filter(a => a.platform === 'X');

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

          {/* Connected Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Connected</p>
            
            {xAccounts.length > 0 ? (
              <div className="space-y-2">
                {xAccounts.map((account) => (
                  <div key={account.id} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    {account.profileImageUrl ? (
                      <img 
                        src={account.profileImageUrl} 
                        alt={account.accountHandle}
                        className="w-6 h-6 rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-sm">𝕏</span>
                    )}
                    <span className="text-sm text-emerald-400 truncate">@{account.accountHandle}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Link 
                href="/settings" 
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <span>𝕏</span>
                <span>Connect X</span>
              </Link>
            )}
          </div>
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
            {xAccounts.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-emerald-400">Ready to post</span>
              </div>
            )}
            
            <button 
              onClick={handleNewPost}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 rounded-full border border-slate-700"
                }
              }}
            />
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
        connectedAccounts={connectedAccounts}
      />
    </div>
  );
}
