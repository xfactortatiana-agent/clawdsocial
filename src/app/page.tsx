import Link from "next/link";
import { Calendar, Sparkles, Zap, BarChart3, Users, Shield, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">ClawdSocial</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="px-5 py-2.5 bg-white text-slate-950 rounded-lg text-sm font-semibold">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-300">Now with Agent Workflows</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
            <span className="text-white">Social media</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">powered by AI</span>
          </h1>

          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Schedule, publish, and analyze across all major platforms. 
            Built for creators, agencies, and autonomous agents.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard" className="px-8 py-4 bg-white text-slate-950 rounded-xl font-semibold flex items-center gap-2">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Everything you need to scale</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: "Visual Calendar", desc: "Drag, drop, and schedule with an intuitive interface" },
              { icon: Sparkles, title: "AI Content Studio", desc: "Generate captions and content with AI" },
              { icon: Zap, title: "Agent Workflows", desc: "Connect to Shinra for autonomous posting" },
              { icon: BarChart3, title: "Analytics", desc: "Track performance and growth" },
              { icon: Users, title: "Team Collaboration", desc: "Approval workflows and permissions" },
              { icon: Shield, title: "Enterprise Security", desc: "SOC 2 compliant with audit logs" },
            ].map((f) => (
              <div key={f.title} className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
                <f.icon className="w-8 h-8 text-violet-400 mb-4" />
                <h3 className="font-semibold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center text-slate-500">
          <p>© 2026 ClawdSocial. Built by ClawdCorp.</p>
        </div>
      </footer>
    </div>
  );
}
