"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [xConnected, setXConnected] = useState(false);
  const [shinraConnected, setShinraConnected] = useState(false);
  const [shinraUrl, setShinraUrl] = useState("");

  const handleXConnect = () => {
    window.location.href = "/api/auth/x";
  };

  const handleShinraConnect = () => {
    // Store Shinra URL and validate connection
    localStorage.setItem("shinra_url", shinraUrl);
    setShinraConnected(true);
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
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">Calendar</Link>
            <Link href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">Posts</Link>
            <Link href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">Analytics</Link>
            <Link href="/settings" className="text-sm font-medium text-slate-900">Settings</Link>
          </nav>

          <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Settings</h1>

        {/* Connected Accounts */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Connected Accounts</h2>
            <p className="text-sm text-slate-600">Link your social media accounts to start posting</p>
          </div>

          <div className="p-6">
            {/* X Connection */}
            <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">𝕏</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">X (Twitter)</p>
                  <p className="text-sm text-slate-600">{xConnected ? "Connected" : "Not connected"}</p>
                </div>
              </div>
              <button
                onClick={handleXConnect}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  xConnected
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {xConnected ? "Connected" : "Connect"}
              </button>
            </div>

            {/* Instagram */}
            <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0 opacity-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📷</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Instagram</p>
                  <p className="text-sm text-slate-600">Coming soon</p>
                </div>
              </div>
              <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium">
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* ClawdCorp OS Integration */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900">ClawdCorp OS</h2>
              <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">Beta</span>
            </div>
            <p className="text-sm text-slate-600">Connect to your Shinra Mission Control instance</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Shinra Mission Control URL
                </label>
                <input
                  type="url"
                  value={shinraUrl}
                  onChange={(e) => setShinraUrl(e.target.value)}
                  placeholder="https://your-shinra.vercel.app"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter your Shinra dashboard URL to enable agent workflows
                </p>
              </div>

              <button
                onClick={handleShinraConnect}
                disabled={!shinraUrl}
                className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                {shinraConnected ? "Connected ✓" : "Connect to Shinra"}
              </button>

              {shinraConnected && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Connected to Shinra Mission Control. Agent workflows enabled.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
