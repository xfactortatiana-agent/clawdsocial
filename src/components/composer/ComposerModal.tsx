"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X, Sparkles, Image as ImageIcon, Calendar, Clock } from "lucide-react";

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
}

const platforms = [
  { id: "x", name: "X (Twitter)", icon: "𝕏" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
];

export function ComposerModal({ isOpen, onClose, initialDate }: ComposerModalProps) {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("x");
  const [scheduledDate, setScheduledDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [isGenerating, setIsGenerating] = useState(false);
  const [charCount, setCharCount] = useState(0);

  if (!isOpen) return null;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    setCharCount(text.length);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const generated = "🚀 Excited to share what we've been building! AI-powered social media management that understands your brand voice.";
    setContent(generated);
    setCharCount(generated.length);
    setIsGenerating(false);
  };

  const handleSave = () => {
    console.log("Saving post:", { content, platform, scheduledDate, scheduledTime });
    onClose();
  };

  const selectedPlatform = platforms.find((p) => p.id === platform);
  const charLimit = platform === "x" ? 280 : 2200;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create Post</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Platform Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Platform</label>
            <div className="grid grid-cols-4 gap-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                    platform === p.id
                      ? "bg-violet-600/20 border-violet-500 text-white"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Content</label>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 text-violet-400 rounded-lg text-sm hover:bg-violet-600/30 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating ? "Generating..." : "Generate with AI"}
              </button>
            </div>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="What would you like to share?"
              className="w-full min-h-[160px] px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Use @ to mention, # for hashtags</span>
              <span className={`font-medium ${charCount > charLimit ? "text-rose-500" : "text-slate-400"}`}>
                {charCount}/{charLimit}
              </span>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Media</label>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors">
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm">Add Image</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors">
                <span className="text-sm">🎬 Add Video</span>
              </button>
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Schedule</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
                />
              </div>
              <div className="relative w-32">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Save as Draft
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
            >
              Schedule Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
