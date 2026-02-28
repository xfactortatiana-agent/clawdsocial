"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SettingsContent() {
  const searchParams = useSearchParams();
  const [xConnected, setXConnected] = useState(false);
  const [xUsername, setXUsername] = useState("");
  const [shinraConnected, setShinraConnected] = useState(false);
  const [shinraUrl, setShinraUrl] = useState("");

  useEffect(() => {
    const connected = searchParams.get("connected");
    const username = searchParams.get("username");
    
    if (connected === "x" && username) {
      setXConnected(true);
      setXUsername(username);
    }
  }, [searchParams]);

  const handleXConnect = () => {
    window.location.href = "/api/auth/x";
  };

  const handleShinraConnect = () => {
    localStorage.setItem("shinra_url", shinraUrl);
    setShinraConnected(true);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-white">ClawdSocial</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">Calendar</Link>
            <Link href="/settings" className="text-sm text-white">Settings</Link>
          </nav>

          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-white">Connected Accounts</h2>
            <p className="text-sm text-slate-400">Link your social media accounts</p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between py-4 border-b border-slate-800 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">𝕏</span>
                </div>
                <div>
                  <p className="font-medium text-white">X (Twitter)</p>
                  {xConnected ? (
                    <p className="text-sm text-emerald-400">Connected as @{xUsername}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Not connected</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleXConnect}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  xConnected
                    ? "bg-emerald-600/20 text-emerald-400"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
              >
                {xConnected ? "Connected ✓" : "Connect"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white">ClawdCorp OS</h2>
              <span className="px-2 py-0.5 bg-violet-600/20 text-violet-400 text-xs rounded-full">Beta</span>
            </div>
            <p className="text-sm text-slate-400">Connect to Shinra Mission Control</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <input
                type="url"
                value={shinraUrl}
                onChange={(e) => setShinraUrl(e.target.value)}
                placeholder="https://your-shinra.vercel.app"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={handleShinraConnect}
                disabled={!shinraUrl}
                className="w-full px-4 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {shinraConnected ? "Connected ✓" : "Connect to Shinra"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Loading...</div>
    </div>}>
      <SettingsContent />
    </Suspense>
  );
}
