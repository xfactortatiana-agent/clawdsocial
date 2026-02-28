"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Sparkles, Image as ImageIcon, Calendar, Clock, Check, Loader2, Link2, Wand2 } from "lucide-react";

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  connectedAccounts?: any[];
}

const allPlatforms = [
  { id: "x", name: "X (Twitter)", icon: "𝕏" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
];

const tones = [
  { id: 'professional', name: 'Professional', description: 'Authoritative & business-focused' },
  { id: 'casual', name: 'Casual', description: 'Friendly & conversational' },
  { id: 'witty', name: 'Witty', description: 'Clever & humorous' },
  { id: 'inspiring', name: 'Inspiring', description: 'Motivational & uplifting' },
  { id: 'educational', name: 'Educational', description: 'Informative & teaching' },
];

const lengths = [
  { id: 'short', name: 'Short', chars: '50-100 chars' },
  { id: 'medium', name: 'Medium', chars: '100-200 chars' },
  { id: 'long', name: 'Long', chars: '200-280 chars' },
  { id: 'thread', name: 'Thread', chars: 'Multiple tweets' },
];

export function ComposerModal({ isOpen, onClose, initialDate, connectedAccounts = [] }: ComposerModalProps) {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("x");
  const [scheduledDate, setScheduledDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [postStatus, setPostStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // AI Generation states
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiLength, setAiLength] = useState("medium");
  const [aiType, setAiType] = useState<'single' | 'thread'>('single');
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<'prompt' | 'url'>('prompt');

  // Get X accounts from connected accounts
  const xAccounts = connectedAccounts.filter(a => a.platform === 'X');
  const hasXConnected = xAccounts.length > 0;

  // Filter platforms based on connected accounts
  const availablePlatforms = allPlatforms.map(p => ({
    ...p,
    connected: p.id === 'x' ? hasXConnected : false,
    accounts: p.id === 'x' ? xAccounts : []
  }));

  // Set default platform to X if connected
  useEffect(() => {
    if (hasXConnected && platform !== 'x') {
      setPlatform('x');
    }
  }, [hasXConnected, platform]);

  // Clear status when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPostStatus(null);
      setContent("");
      setCharCount(0);
      setShowAIGenerator(false);
      setGeneratedOptions([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    setCharCount(text.length);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim() && activeTab === 'prompt') return;
    if (!urlInput.trim() && activeTab === 'url') return;
    
    setIsGenerating(true);
    setGeneratedOptions([]);

    try {
      let res;
      
      if (activeTab === 'url') {
        res = await fetch('/api/ai/generate', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: urlInput,
            tone: aiTone
          })
        });
      } else {
        res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: aiPrompt,
            tone: aiTone,
            length: aiLength,
            type: aiType
          })
        });
      }

      const data = await res.json();

      if (res.ok) {
        if (data.result.type === 'thread' && data.result.tweets) {
          setGeneratedOptions(data.result.tweets);
        } else {
          setGeneratedOptions([data.result.content]);
        }
      } else {
        setPostStatus({
          type: 'error',
          message: data.error || 'AI generation failed'
        });
      }
    } catch (err) {
      setPostStatus({
        type: 'error',
        message: 'Network error during AI generation'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectGeneratedContent = (text: string) => {
    setContent(text);
    setCharCount(text.length);
    setShowAIGenerator(false);
    setGeneratedOptions([]);
  };

  const handlePost = async (publishNow: boolean = false) => {
    if (!content.trim() || !hasXConnected) return;
    
    setIsPosting(true);
    setPostStatus(null);

    try {
      const scheduledFor = publishNow 
        ? null 
        : new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          platform: 'X',
          scheduledFor
        })
      });

      const data = await res.json();

      if (res.ok) {
        setPostStatus({
          type: 'success',
          message: publishNow 
            ? 'Post published successfully!' 
            : 'Post scheduled successfully!'
        });
        setContent("");
        setCharCount(0);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setPostStatus({
          type: 'error',
          message: data.error || data.details || 'Failed to post. Please try again.'
        });
      }
    } catch (err) {
      setPostStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      });
    } finally {
      setIsPosting(false);
    }
  };

  const selectedPlatform = availablePlatforms.find((p) => p.id === platform);
  const charLimit = platform === "x" ? 280 : 2200;

  // AI Generator View
  if (showAIGenerator) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAIGenerator(false)} />
        
        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wand2 className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">AI Content Generator</h2>
            </div>
            <button onClick={() => setShowAIGenerator(false)} className="p-2 hover:bg-slate-800 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
              <button
                onClick={() => setActiveTab('prompt')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'prompt' 
                    ? 'bg-violet-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                From Prompt
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'url' 
                    ? 'bg-violet-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                From URL
              </button>
            </div>

            {activeTab === 'prompt' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">What would you like to post about?</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Launching our new AI feature that helps creators write better content..."
                    className="w-full min-h-[100px] px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Tone</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                      {tones.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Length</label>
                    <select
                      value={aiLength}
                      onChange={(e) => setAiLength(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                      {lengths.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.chars})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Format</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAiType('single')}
                      className={`flex-1 py-3 px-4 rounded-xl border transition-colors ${
                        aiType === 'single'
                          ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400'
                      }`}
                    >
                      Single Post
                    </button>
                    <button
                      onClick={() => setAiType('thread')}
                      className={`flex-1 py-3 px-4 rounded-xl border transition-colors ${
                        aiType === 'thread'
                          ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400'
                      }`}
                    >
                      Thread
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Paste URL to summarize</label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-4 py-3 pl-10 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || (activeTab === 'prompt' ? !aiPrompt.trim() : !urlInput.trim())}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Content
                </>
              )}
            </button>

            {/* Generated Options */}
            {generatedOptions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300">Choose an option:</p>
                {generatedOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectGeneratedContent(option)}
                    className="w-full p-4 bg-slate-800/50 border border-slate-700 hover:border-violet-500 rounded-xl text-left text-slate-300 text-sm transition-colors"
                  >
                    {aiType === 'thread' ? (
                      <span className="text-violet-400 font-medium">{idx + 1}/</span>
                    ) : null}
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Composer View
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
          {/* Status Message */}
          {postStatus && (
            <div className={`px-4 py-3 rounded-xl ${
              postStatus.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <p className={`text-sm ${
                postStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {postStatus.message}
              </p>
            </div>
          )}

          {/* Connected Account Banner */}
          {hasXConnected && platform === 'x' && (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-emerald-400 font-medium">
                  Posting as @{xAccounts[0]?.accountHandle}
                </p>
                <p className="text-xs text-emerald-400/70">Your X account is connected and ready</p>
              </div>
              {xAccounts[0]?.profileImageUrl && (
                <img 
                  src={xAccounts[0].profileImageUrl} 
                  alt={xAccounts[0].accountHandle}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/30" 
                />
              )}
            </div>
          )}

          {/* Platform Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Platform</label>
            <div className="grid grid-cols-4 gap-2">
              {availablePlatforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => p.connected && setPlatform(p.id)}
                  disabled={!p.connected}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all relative ${
                    platform === p.id
                      ? "bg-violet-600/20 border-violet-500 text-white"
                      : p.connected
                      ? "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                      : "bg-slate-800/30 border-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                  {!p.connected && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-slate-600 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
            {!hasXConnected && (
              <p className="text-xs text-slate-500">
                Connect your X account in {<a href="/settings" className="text-violet-400 hover:underline">Settings</a>} to enable posting
              </p>
            )}
          </div>

          {/* Content Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Content</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIGenerator(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  AI Generate
                </button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="What would you like to share?"
              disabled={!hasXConnected || isPosting}
              className="w-full min-h-[160px] px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <button 
                disabled={!hasXConnected}
                className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm">Add Image</span>
              </button>
              <button 
                disabled={!hasXConnected}
                className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
                  disabled={!hasXConnected || isPosting}
                  className="w-full px-4 py-3 pl-10 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 disabled:opacity-50"
                />
              </div>
              <div className="relative w-32">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  disabled={!hasXConnected || isPosting}
                  className="w-full px-4 py-3 pl-10 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <button
            onClick={() => handlePost(true)}
            disabled={!content.trim() || !hasXConnected || isPosting || charCount > charLimit}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {isPosting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </span>
            ) : (
              'Post Now'
            )}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isPosting}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handlePost(false)}
              disabled={!content.trim() || !hasXConnected || isPosting || charCount > charLimit}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Post'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
