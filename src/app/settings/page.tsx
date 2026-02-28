import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default async function SettingsPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      workspaces: {
        include: {
          workspace: {
            include: {
              accounts: true
            }
          }
        }
      }
    }
  });

  // Get connected X accounts
  const xAccounts = user?.workspaces.flatMap(w => 
    w.workspace.accounts.filter(a => a.platform === 'X' && a.isActive)
  ) || [];

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
                avatarBox: "w-10 h-10 rounded-full"
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
            {xAccounts.length > 0 ? (
              xAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between py-4 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-4">
                    {account.profileImageUrl ? (
                      <img 
                        src={account.profileImageUrl} 
                        alt={account.accountName}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">𝕏</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">X (Twitter)</p>
                      <p className="text-sm text-emerald-400">Connected as @{account.accountHandle}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-lg text-sm">Connected ✓</span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">𝕏</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">X (Twitter)</p>
                    <p className="text-sm text-slate-500">Not connected</p>
                  </div>
                </div>
                <a
                  href="/api/auth/x"
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
                >
                  Connect
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
