import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-xl text-white">ClawdSocial</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-600/25">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-slate-400">Sign in to manage your social media</p>
          </div>

          {/* Sign In Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <SignIn 
              appearance={{
                layout: {
                  socialButtonsVariant: "iconButton",
                  logoPlacement: "none"
                },
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: 
                    "w-12 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center transition-colors",
                  socialButtonsBlockButtonText: "hidden",
                  dividerRow: "border-slate-800",
                  dividerText: "text-slate-500",
                  formFieldLabel: "text-slate-300 text-sm font-medium mb-1.5 block",
                  formFieldInput: 
                    "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all",
                  formFieldErrorText: "text-rose-400 text-sm mt-1",
                  formButtonPrimary: 
                    "w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-600/20",
                  footer: "text-center mt-6",
                  footerActionText: "text-slate-400",
                  footerActionLink: "text-violet-400 hover:text-violet-300 font-medium ml-1",
                  identityPreview: "bg-slate-800 border-slate-700 rounded-xl p-4",
                  identityPreviewText: "text-white",
                  identityPreviewEditButton: "text-violet-400 hover:text-violet-300",
                  formResendCodeLink: "text-violet-400 hover:text-violet-300",
                  alert: "bg-rose-500/10 border-rose-500/20 text-rose-400 rounded-xl p-4",
                  alertText: "text-rose-400"
                },
                variables: {
                  colorPrimary: "#8b5cf6",
                  colorBackground: "transparent",
                  colorText: "#f8fafc",
                  colorTextSecondary: "#94a3b8",
                  colorDanger: "#f43f5e"
                }
              }}
            />
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-sm mt-8">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-slate-400 hover:text-white">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-slate-400 hover:text-white">Privacy Policy</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
