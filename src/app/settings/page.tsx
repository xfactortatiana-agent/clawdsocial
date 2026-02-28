"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [xAccount, setXAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");

  // Check if user has X connected via Clerk
  useEffect(() => {
    if (user) {
      console.log('All external accounts:', user.externalAccounts);
      
      // Debug: show all accounts
      const debug = user.externalAccounts.map((a: any) => ({
        provider: a.provider,
        providerUserId: a.providerUserId,
        username: a.username,
        emailAddress: a.emailAddress,
        verification: a.verification?.status,
        id: a.id
      }));
      setDebugInfo(JSON.stringify(debug, null, 2));
      
      // Find X/Twitter account
      const foundAccount = user.externalAccounts.find(
        (account) => account.provider === 'x' || account.provider === 'twitter'
      );
      
      setXAccount(foundAccount || null);
      setIsLoading(false);
      
      if (foundAccount?.verification?.status === 'verified') {
        saveXToDatabase(foundAccount);
      }
    }
  }, [user]);

  const saveXToDatabase = async (account: any) => {
    if (!user) return;
    
    const identifier = account.username || 
                      account.emailAddress ||
                      account.providerUserId;
    
    if (!identifier) return;
    
    try {
      await fetch('/api/auth/x/clerk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identifier,
          name: account.firstName || identifier,
          pfp: account.imageUrl
        })
      });
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleConnectX = () => {
    if (!user) return;
    
    // @ts-ignore
    user.createExternalAccount({
      strategy: 'oauth_x',
      redirectUrl: window.location.href,
    }).then((res: any) => {
      console.log('createExternalAccount result:', res);
      if (res?.verification?.externalVerificationRedirectURL) {
        window.location.href = res.verification.externalVerificationRedirectURL;
      }
    }).catch((err: any) => {
      console.error('Error:', err);
      // Check if error is because already connected
      if (err.message?.includes('already')) {
        alert('X is already connected to this account');
      } else {
        alert('Error: ' + err.message);
      }
    });
  };

  const handleDisconnectX = async () => {
    if (!xAccount) return;
    
    try {
      await xAccount.destroy();
      await user?.reload();
      setXAccount(null);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      alert('Failed to disconnect. Try refreshing the page.');
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const isVerified = xAccount?.verification?.status === 'verified';
  const displayName = xAccount?.username || 
                     xAccount?.emailAddress ||
                     xAccount?.providerUserId ||
                     'Connected';

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

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-white">Connected Accounts</h2>
            <p className="text-sm text-slate-400">Link your social media accounts</p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {xAccount?.imageUrl ? (
                  <img 
                    src={xAccount.imageUrl} 
                    alt={displayName} 
                    className="w-12 h-12 rounded-xl object-cover" 
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">𝕏</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">X (Twitter)</p>
                  {xAccount ? (
                    <p className="text-sm text-emerald-400">
                      {isVerified ? '✓ Verified' : '⏳ Pending'} — {displayName}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">Not connected</p>
                  )}
                </div>
              </div>
              
              {xAccount ? (
                <button
                  onClick={handleDisconnectX}
                  className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectX}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
                >
                  Connect X
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Debug */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400 mb-2">Debug (External Accounts):</p>
          <pre className="text-xs text-slate-500 overflow-auto max-h-40">{debugInfo || 'None'}</pre>
        </div>
      </main>
    </div>
  );
}
