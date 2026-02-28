"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [xAccounts, setXAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch connected X accounts from our database
  useEffect(() => {
    if (user) {
      fetchXAccounts();
    }
  }, [user]);

  const fetchXAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setXAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectX = () => {
    // Use our custom OAuth flow
    window.location.href = '/api/auth/x';
  };

  const handleDisconnectX = async (accountId: string) => {
    try {
      await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
      setXAccounts(xAccounts.filter(a => a.id !== accountId));
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setError("Failed to disconnect. Please try again.");
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

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

          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-white">Connected Accounts</h2>
            <p className="text-sm text-slate-400">Link your social media accounts to start posting</p>
          </div>

          <div className="p-6">
            {xAccounts.length === 0 ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">𝕏</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">X (Twitter)</p>
                    <p className="text-sm text-slate-500">Not connected</p>
                  </div>
                </div>
                
                <button
                  onClick={handleConnectX}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
                >
                  Connect X
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {xAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {account.profileImageUrl ? (
                        <img 
                          src={account.profileImageUrl} 
                          alt={account.accountHandle}
                          className="w-12 h-12 rounded-xl object-cover" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">𝕏</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">X (Twitter)</p>
                        <p className="text-sm text-emerald-400">
                          ✓ Connected — @{account.accountHandle}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDisconnectX(account.id)}
                      className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30"
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={handleConnectX}
                  className="w-full mt-4 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700"
                >
                  + Connect Another X Account
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
