import Link from "next/link";
import { Calendar, Sparkles, Zap, BarChart3, Users, Shield, ArrowRight, Play } from "lucide-react";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { TerminalText } from "@/components/effects/TerminalText";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowCard } from "@/components/effects/GlowCard";
import { AnimatedCounter } from "@/components/effects/AnimatedCounter";

const features = [
  { icon: Calendar, title: "Visual Calendar", desc: "Drag, drop, and schedule with an intuitive interface", color: "from-violet-500/20 to-purple-500/20" },
  { icon: Sparkles, title: "AI Content Studio", desc: "Generate captions and content with AI", color: "from-fuchsia-500/20 to-pink-500/20" },
  { icon: Zap, title: "Agent Workflows", desc: "Connect to Shinra for autonomous posting", color: "from-cyan-500/20 to-blue-500/20" },
  { icon: BarChart3, title: "Predictive Analytics", desc: "Know what works before you post", color: "from-emerald-500/20 to-teal-500/20" },
  { icon: Users, title: "Team Collaboration", desc: "Approval workflows and permissions", color: "from-amber-500/20 to-orange-500/20" },
  { icon: Shield, title: "Enterprise Security", desc: "SOC 2 compliant with audit logs", color: "from-rose-500/20 to-red-500/20" },
];

const stats = [
  { value: 10, suffix: "M+", label: "Posts Scheduled" },
  { value: 50, suffix: "K+", label: "Active Users" },
  { value: 99, suffix: ".9%", label: "Uptime" },
  { value: 4, suffix: ".9★", label: "User Rating" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <ParticleBackground />
      
      {/* Floating Orbs */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-fuchsia-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/50 backdrop-blur-2xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="font-bold text-xl text-white">ClawdSocial</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</Link>
            <Link href="#stats" className="text-sm text-slate-400 hover:text-white transition-colors">Stats</Link>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link>
          </div>

          <Link href="/dashboard" className="group relative px-5 py-2.5 overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600 transition-transform group-hover:scale-105" />
            <span className="relative text-white text-sm font-semibold">Get Started</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-slate-300">Now with Agent Workflows</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
                <span className="text-white">Social media</span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">powered by AI</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
                Schedule, publish, and analyze across all major platforms.
                Built for creators, agencies, and autonomous agents.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex justify-center mb-10">
                <div className="px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <TerminalText />
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex items-center justify-center gap-4">
                <Link href="/dashboard" className="group px-8 py-4 bg-white text-slate-950 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-200 transition-all">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="group px-8 py-4 bg-slate-800/50 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-800 transition-all border border-slate-700">
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform" /> Watch Demo
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 px-4 border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 100}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-slate-400">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">Everything you need to scale</h2>
            <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">Powerful features designed for modern social media management</p>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 100}>
                <GlowCard glowColor={f.color}>
                  <f.icon className="w-10 h-10 text-violet-400 mb-4" />
                  <h3 className="font-semibold text-white text-xl mb-2">{f.title}</h3>
                  <p className="text-slate-400">{f.desc}</p>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-violet-600/20 via-fuchsia-600/20 to-cyan-600/20 border border-slate-700/50">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to transform your social media?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">Join thousands of creators and agencies using ClawdSocial to grow their presence.</p>
            <Link href="/dashboard" className="inline-flex px-8 py-4 bg-white text-slate-950 rounded-xl font-semibold hover:bg-slate-200 transition-colors">
              Get Started Free
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto text-center text-slate-500">
          <p>© 2026 ClawdSocial. Built by ClawdCorp.</p>
        </div>
      </footer>
    </div>
  );
}
