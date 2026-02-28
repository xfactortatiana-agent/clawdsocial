"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";

export default function SettingsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [xConnected, setXConnected] = useState(false);
  const [xUsername, setXUsername] = useState("");
  const [xPfp, setXPfp] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if user has X connected via Clerk
    if (user) {
      const xAccount = user.externalAccounts.find(
        (account) => account.provider === 'x' || account.provider === 'twitter'
      );
      
      if (xAccount) {
        setXConnected(true);
        setXUsername(xAccount.username || '');
        setXPfp(xAccount.imageUrl || '');
        
        // Save to our database
        saveXConnection(xAccount.username || '', xAccount.imageUrl || '');
      }
    }
  }, [user]);

  const saveXConnection = async (username: string, pfp: string) => {
    if (!username) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/x/clerk');
      
      if (response.ok) {
        console.log('X connection saved to database');
      } else {
        console.error('Failed to save X connection');
      }
    } catch (err) {
      console.error('Error saving X connection:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleXConnect = () => {
    // Use Clerk's built-in social connection
    if (user) {
      // Open Clerk's account connection UI
      window.open(`https://accounts.clerk.dev/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`, '_self');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Please sign in to access settings</p>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium">
              Sign In
            </button>
          </SignInButton>
        </div>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-white">Connected Accounts</h2>
            <p className="text-sm text-slate-400">Link your social media accounts</p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                {xPfp ? (
                  <img 
                    src={xPfp} 
                    alt={xUsername}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">𝕏</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">X (Twitter)</p>
                  {xConnected ? (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-emerald-400">Connected as @{xUsername}</p>
                      {isSaving && <span className="text-xs text-slate-500">Saving...</span>}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Not connected</p>
                  )}
                </div>
              </div>
              <div>
                {xConnected ? (
                  <span className="px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg text-sm font-medium">
                    Connected ✓
                  </span>
                ) : (
                  <a
                    href="https://accounts.clerk.dev/user/profile/connections"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
                  >
                    Connect via Clerk
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
