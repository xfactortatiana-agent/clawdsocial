"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { RefreshCw, Loader2, Menu, X, ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [xAccounts, setXAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleSyncAnalytics = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError("");

    try {
      const res = await fetch('/api/cron/sync-analytics', {
        headers: {
          'Authorization': 'Bearer b46d5e1b6f9d6d079c33d34f0b1ef4b744798933b1f70297b5eb94a4d9c1afcb'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const totalPosts = data.results?.reduce((sum: number, r: any) => sum + (r.posts?.synced || 0), 0) || 0;
        const totalReplies = data.results?.reduce((sum: number, r: any) => sum + (r.replies?.synced || 0), 0) || 0;
        const followerCount = data.results?.[0]?.followerCount || 0;
        const errors = data.results?.filter((r: any) => r.error) || [];
        
        if (errors.length > 0) {
          setSyncResult({
            success: false,
            message: `Sync partially failed: ${errors[0].error}`
          });
        } else {
          setSyncResult({
            success: true,
            message: `Synced ${totalPosts} posts, ${totalReplies} replies • ${followerCount.toLocaleString()} followers`
          });
        }
        fetchXAccounts();
      } else {
        setSyncResult({
          success: false,
          message: data.error || data.details || 'Sync failed'
        });
      }
    } catch (err) {
      setSyncResult({
        success: false,
        message: 'Network error during sync'
      });
    } finally {
      setIsSyncing(false);
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
      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-900/50 border-b border-slate-800">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>
          <span className="font-semibold text-white">Settings</span>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="px-4 py-3 border-t border-slate-800 space-y-2">
            <Link href="/dashboard" className="block py-2 text-slate-400 hover:text-white">Calendar</Link>
            <Link href="/analytics" className="block py-2 text-slate-400 hover:text-white">Analytics</Link>
            <Link href="/settings" className="block py-2 text-white">Settings</Link>
          </div>
        )}
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-slate-900/50 border-b border-slate-800">
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
            <Link href="/analytics" className="text-sm text-slate-400 hover:text-white">Analytics</Link>
            <Link href="/settings" className="text-sm text-white">Settings</Link>
          </nav>

          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-6 lg:mb-8">Settings</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {syncResult && (
          <div className={`mb-6 p-4 rounded-xl ${
            syncResult.success 
              ? 'bg-emerald-500/10 border border-emerald-500/30' 
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <p className={`text-sm ${syncResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
              {syncResult.message}
            </p>
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mb-6">
          <div className="px-4 lg:px-6 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-white">Connected Accounts</h2>
            <p className="text-sm text-slate-400">Link your social media accounts</p>
          </div>

          <div className="p-4 lg:p-6">
            {xAccounts.length === 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  className="w-full sm:w-auto px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
                >
                  Connect X
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {xAccounts.map((account) => (
                  <div key={account.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                        {account.isActive ? (
                          <div className="text-sm text-emerald-400">
                            <p>✓ @{account.accountHandle}</p>
                            <p className="text-xs text-emerald-400/70">
                              {account.followerCount?.toLocaleString() || 0} followers
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-amber-400">⚠ Reconnect needed</p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDisconnectX(account.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30"
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

        {xAccounts.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 lg:px-6 py-4 border-b border-slate-800">
              <h2 className="font-semibold text-white">Analytics Sync</h2>
              <p className="text-sm text-slate-400">Import historical posts from X</p>
            </div>

            <div className="p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-300">
                    Last synced: {xAccounts[0]?.lastSyncedAt 
                      ? new Date(xAccounts[0].lastSyncedAt).toLocaleString() 
                      : 'Never'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Auto-syncs daily</p>
                </div>
                
                <button
                  onClick={handleSyncAnalytics}
                  disabled={isSyncing}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Sync Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
