import Link from "next/link";
import { Calendar, Sparkles, Zap, BarChart3, Users, Shield, ArrowRight, Play } from "lucide-react";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { TerminalText } from "@/components/effects/TerminalText";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <ParticleBackground />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-xl blur-lg opacity-50" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="font-bold text-xl text-white">ClawdSocial</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="px-5 py-2.5 bg-white text-slate-950 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700 mb-8">
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
            </p>

            <div className="flex justify-center mb-8">
              <TerminalText />
            </div>

            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard" className="group px-8 py-4 bg-white text-slate-950 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-200 transition-all">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 bg-slate-800/50 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-800 transition-all border border-slate-700">
                <Play className="w-5 h-5" /> Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Everything you need</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: "Visual Calendar", desc: "Drag, drop, and schedule" },
              { icon: Sparkles, title: "AI Studio", desc: "Generate content with AI" },
              { icon: Zap, title: "Agent Workflows", desc: "Autonomous posting" },
              { icon: BarChart3, title: "Analytics", desc: "Track performance" },
              { icon: Users, title: "Team", desc: "Collaborate seamlessly" },
              { icon: Shield, title: "Security", desc: "Enterprise grade" },
            ].map((f) => (
              <div key={f.title} className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-all">
                <f.icon className="w-8 h-8 text-violet-400 mb-4" />
                <h3 className="font-semibold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center text-slate-500">
          <p>© 2026 ClawdSocial. Built by ClawdCorp.</p>
        </div>
      </footer>
    </div>
  );
}
