import { Calendar } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl">ClawdSocial</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Social media management,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              powered by AI
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Schedule, publish, and analyze across all major platforms from one beautiful dashboard. 
            Built for creators, agencies, and autonomous agents.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link 
              href="/sign-up" 
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800"
            >
              Start Free Trial
            </Link>
            <Link 
              href="#features" 
              className="px-6 py-3 border border-slate-200 rounded-xl font-medium hover:bg-slate-50"
            >
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to scale</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Visual Calendar",
                desc: "Drag, drop, and schedule your content with an intuitive calendar interface."
              },
              {
                title: "AI Content Studio",
                desc: "Generate captions, threads, and ideas with AI that matches your brand voice."
              },
              {
                title: "Multi-Platform",
                desc: "Post to X, Instagram, LinkedIn, TikTok, and more from one dashboard."
              },
              {
                title: "Team Collaboration",
                desc: "Approval workflows, comments, and role-based access for your team."
              },
              {
                title: "Analytics",
                desc: "Track performance, engagement, and growth across all platforms."
              },
              {
                title: "Agent Integration",
                desc: "Connect with Shinra Mission Control for autonomous agent workflows."
              }
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="max-w-6xl mx-auto text-center text-slate-500">
          <p>© 2025 ClawdSocial. Built by ClawdCorp.</p>
        </div>
      </footer>
    </div>
  );
}
