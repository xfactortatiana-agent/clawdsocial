"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

function SettingsContent() {
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [xConnected, setXConnected] = useState(false);
  const [xUsername, setXUsername] = useState("");
  const [xName, setXName] = useState("");
  const [xPfp, setXPfp] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const connected = searchParams.get("connected");
    const username = searchParams.get("username");
    const name = searchParams.get("name");
    const pfp = searchParams.get("pfp");
    const errorParam = searchParams.get("error");
    
    if (errorParam) {
      setError(errorParam);
      return;
    }
    
    if (connected === "x" && username) {
      setXConnected(true);
      setXUsername(username);
      setXName(name || username);
      setXPfp(pfp || "");
      
      // Save to database
      saveToDatabase(username, name || username, pfp || "");
    }
  }, [searchParams]);

  const saveToDatabase = async (username: string, name: string, pfp: string) => {
    if (!user) {
      console.log('No user yet, waiting...');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/x/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          name, 
          pfp,
          clerkId: user.id 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Saved to database:', data);
      } else {
        console.error('Failed to save:', data);
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleXConnect = () => {
    window.location.href = "/api/auth/x";
  };

  if (!isLoaded) {
    return <div className="text-slate-400">Loading...</div>;
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-rose-600/20 border border-rose-600/50 rounded-xl text-rose-400">
          Error: {error}
        </div>
      )}
      
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
                  alt={xName}
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
            <button
              onClick={handleXConnect}
              disabled={xConnected}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                xConnected
                  ? "bg-emerald-600/20 text-emerald-400 cursor-default"
                  : "bg-violet-600 text-white hover:bg-violet-700"
              }`}
            >
              {xConnected ? "Connected ✓" : "Connect"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
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

        <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
          <SettingsContent />
        </Suspense>
      </main>
    </div>
  );
}
