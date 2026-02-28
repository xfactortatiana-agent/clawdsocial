"use client";

import { ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({ children, className = "", glowColor = "from-violet-500/20 to-cyan-500/20" }: GlowCardProps) {
  return (
    <div className={`group relative ${className}`}>
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${glowColor} rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500`} />
      <div className="relative h-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
