import Link from "next/link";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <span className="font-bold text-xl text-white">ClawdSocial</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</Link>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/settings" className="text-sm text-slate-400 hover:text-white transition-colors">Settings</Link>
        </nav>

        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 rounded-full border border-slate-700"
                }
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                Sign In
              </button>
            </SignInButton>
            <Link 
              href="/sign-up" 
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
