"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Calendar, 
  Clock, 
  Check, 
  Loader2,
  Link2,
  Wand2,
  Smile,
  Bold,
  Italic,
  List,
  Hash,
  AtSign,
  Eye,
  Trash2,
  Plus,
  Send,
  Type
} from "lucide-react";

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  connectedAccounts?: any[];
}

const allPlatforms = [
  { id: "x", name: "X", icon: "𝕏", color: "#000000" },
  { id: "instagram", name: "Instagram", icon: "📷", color: "#E4405F" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "#0A66C2" },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "#000000" },
];

const tones = [
  { id: 'match_voice', name: 'Match My Voice', description: 'Analyzes your past posts' },
  { id: 'professional', name: 'Professional', description: 'Authoritative & business-focused' },
  { id: 'casual', name: 'Casual', description: 'Friendly & conversational' },
  { id: 'witty', name: 'Witty', description: 'Clever & sharp' },
  { id: 'educational', name: 'Educational', description: 'Informative & teaching' },
];

const lengths = [
  { id: 'short', name: 'Short', chars: '50-100 chars' },
  { id: 'medium', name: 'Medium', chars: '100-200 chars' },
  { id: 'long', name: 'Long', chars: '200-280 chars' },
  { id: 'thread', name: 'Thread', chars: 'Multiple tweets' },
];

const emojis = {
  fire: ['🔥', '⚡️', '💥', '🚀', '💫', '✨', '🌟', '💪'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍'],
  faces: ['😀', '😂', '🤔', '😎', '🤯', '🥳', '😍', '🙄'],
  objects: ['💡', '🎯', '📊', '💰', '🔑', '📈', '🎉', '🎁'],
  gestures: ['👍', '👏', '🙌', '✌️', '🤝', '👆', '👇', '💯']
};

// Parse content with formatting to React elements
function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null;
  
  // Split by patterns: **bold**, *italic*, `code`, #hashtag, @mention, https://links
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|#[\w]+|@[\w]+|https?:\/\/[^\s]+)/g);
  
  return parts.map((part, i) => {
    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i} className="italic text-slate-200">{part.slice(1, -1)}</em>;
    }
    // Code: `text`
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-slate-700 rounded text-sm font-mono text-cyan-400">{part.slice(1, -1)}</code>;
    }
    // Hashtag: #word
    if (part.startsWith('#') && part.length > 1) {
      return <span key={i} className="text-violet-400 hover:underline cursor-pointer">{part}</span>;
    }
    // Mention: @word
    if (part.startsWith('@') && part.length > 1) {
      return <span key={i} className="text-blue-400 hover:underline cursor-pointer">{part}</span>;
    }
    // Link: https://
    if (part.startsWith('http')) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          {part.length > 30 ? part.slice(0, 30) + '...' : part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

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
  const [showPreview, setShowPreview] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [activeFormat, setActiveFormat] = useState<'bold' | 'italic' | null>(null);
  
  // AI Generation states
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("match_voice");
  const [aiLength, setAiLength] = useState("medium");
  const [aiType, setAiType] = useState<'single' | 'thread'>('single');
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<'prompt' | 'url'>('prompt');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const xAccounts = connectedAccounts.filter(a => a.platform === 'X');
  const hasXConnected = xAccounts.length > 0;

  const availablePlatforms = allPlatforms.map(p => ({
    ...p,
    connected: p.id === 'x' ? hasXConnected : false,
    accounts: p.id === 'x' ? xAccounts : []
  }));

  useEffect(() => {
    if (hasXConnected && platform !== 'x') {
      setPlatform('x');
    }
  }, [hasXConnected, platform]);

  useEffect(() => {
    if (!isOpen) {
      setPostStatus(null);
      setContent("");
      setCharCount(0);
      setShowAIGenerator(false);
      setGeneratedOptions([]);
      setMediaFiles([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    setCharCount(text.length);
    setCursorPosition(e.target.selectionStart);
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newText);
    setCharCount(newText.length);
    
    // Focus and set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      setCursorPosition(newCursorPos);
    }, 0);
    
    setShowEmojiPicker(false);
  };

  const toggleBold = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    // Check if already bold
    const beforeSelection = content.substring(Math.max(0, start - 2), start);
    const afterSelection = content.substring(end, Math.min(content.length, end + 2));
    
    if (beforeSelection === '**' && afterSelection === '**') {
      // Remove bold
      const newText = content.substring(0, start - 2) + selectedText + content.substring(end + 2);
      setContent(newText);
    } else {
      // Add bold
      insertText('**', '**');
    }
  };

  const toggleItalic = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    // Check if already italic (but not bold)
    const beforeSelection = content.substring(Math.max(0, start - 1), start);
    const afterSelection = content.substring(end, Math.min(content.length, end + 1));
    
    if (beforeSelection === '*' && afterSelection === '*' && 
        content.substring(Math.max(0, start - 2), start) !== '**') {
      // Remove italic
      const newText = content.substring(0, start - 1) + selectedText + content.substring(end + 1);
      setContent(newText);
    } else {
      // Add italic
      insertText('*', '*');
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setMediaFiles(prev => [...prev, { url, type }]);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
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
          body: JSON.stringify({ url: urlInput, tone: aiTone })
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
        setPostStatus({ type: 'error', message: data.error || 'AI generation failed' });
      }
    } catch (err) {
      setPostStatus({ type: 'error', message: 'Network error during AI generation' });
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
          scheduledFor,
          mediaUrls: mediaFiles.map(m => m.url)
        })
      });

      const data = await res.json();

      if (res.ok) {
        setPostStatus({
          type: 'success',
          message: publishNow ? 'Post published!' : 'Post scheduled!'
        });
        setTimeout(() => onClose(), 1500);
      } else {
        setPostStatus({ type: 'error', message: data.error || 'Failed to post' });
      }
    } catch (err) {
      setPostStatus({ type: 'error', message: 'Network error' });
    } finally {
      setIsPosting(false);
    }
  };

  const charLimit = platform === "x" ? 280 : 2200;
  const charPercentage = (charCount / charLimit) * 100;
  const charColor = charPercentage > 90 ? 'text-rose-500' : charPercentage > 75 ? 'text-amber-400' : 'text-emerald-400';

  // AI Generator View
  if (showAIGenerator) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setShowAIGenerator(false)} />
        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">AI Content Generator</h2>
                <p className="text-sm text-slate-400">Trained on your voice</p>
              </div>
            </div>
            <button onClick={() => setShowAIGenerator(false)} className="p-2 hover:bg-slate-800 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-800 rounded-xl">
              {['prompt', 'url'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab 
                      ? 'bg-violet-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'prompt' ? 'From Prompt' : 'From URL'}
                </button>
              ))}
            </div>

            {activeTab === 'prompt' ? (
              <>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">What would you like to post about?</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Launching our new AI feature that helps creators write better content..."
                    className="w-full min-h-[100px] px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Tone</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                      {lengths.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Format</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'single', label: 'Single Post', icon: Send },
                      { id: 'thread', label: 'Thread', icon: List }
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => setAiType(fmt.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${
                          aiType === fmt.id
                            ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <fmt.icon className="w-4 h-4" />
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Paste URL to summarize</label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-4 py-3 pl-11 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || (activeTab === 'prompt' ? !aiPrompt.trim() : !urlInput.trim())}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
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
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <p className="text-sm font-medium text-slate-300">Choose an option:</p>
                {generatedOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectGeneratedContent(option)}
                    className="w-full p-4 bg-slate-800/50 border border-slate-700 hover:border-violet-500 hover:bg-slate-800 rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {aiType === 'thread' && (
                        <span className="flex-shrink-0 w-6 h-6 bg-violet-600/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </span>
                      )}
                      <p className="text-slate-300 text-sm leading-relaxed">{option}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="w-3 h-3" />
                      Click to use this
                    </div>
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
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Create Post</h2>
            
            {/* Platform Selector */}
            <div className="flex items-center gap-2">
              {availablePlatforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => p.connected && setPlatform(p.id)}
                  disabled={!p.connected}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    platform === p.id
                      ? "bg-violet-600 text-white"
                      : p.connected
                      ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <span>{p.icon}</span>
                  <span className="hidden sm:inline">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Side - Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Status Message */}
            {postStatus && (
              <div className={`mx-6 mt-4 px-4 py-3 rounded-xl ${
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

            {/* Connected Account */}
            {hasXConnected && (
              <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                {xAccounts[0]?.profileImageUrl ? (
                  <img 
                    src={xAccounts[0].profileImageUrl} 
                    alt={xAccounts[0].accountHandle}
                    className="w-8 h-8 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-8 h-8 bg-emerald-600/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                <span className="text-sm text-emerald-400">Posting as @{xAccounts[0]?.accountHandle}</span>
              </div>
            )}

            {/* Editor Toolbar */}
            <div className="mx-6 mt-4 flex items-center gap-1 p-1 bg-slate-800 rounded-xl">
              <button 
                onClick={toggleBold}
                className={`p-2 rounded-lg transition-colors ${
                  content.includes('**') ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button 
                onClick={toggleItalic}
                className={`p-2 rounded-lg transition-colors ${
                  content.match(/(?<!\*)\*[^*]+\*(?!\*)/) ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-slate-700 mx-1" />
              <button 
                onClick={() => insertText('@')}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Mention"
              >
                <AtSign className="w-4 h-4" />
              </button>
              <button 
                onClick={() => insertText('#')}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Hashtag"
              >
                <Hash className="w-4 h-4" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 p-4 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 w-72">
                    <div className="space-y-3">
                      {Object.entries(emojis).map(([category, emojiList]) => (
                        <div key={category}>
                          <p className="text-xs text-slate-500 uppercase mb-2">{category}</p>
                          <div className="grid grid-cols-8 gap-1">
                            {emojiList.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => insertText(emoji, '')}
                                className="w-7 h-7 hover:bg-slate-700 rounded-lg flex items-center justify-center text-lg transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setShowAIGenerator(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Wand2 className="w-3.5 h-3.5" />
                AI Generate
              </button>
            </div>

            {/* Text Area */}
            <div className="mx-6 mt-4 flex-1 min-h-[200px]">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                placeholder="What's on your mind? Use **bold** or *italic*"
                disabled={!hasXConnected || isPosting}
                className="w-full h-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 disabled:opacity-50 text-lg leading-relaxed font-mono"
              />
            </div>

            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <div className="mx-6 mt-4 flex gap-2 overflow-x-auto pb-2">
                {mediaFiles.map((media, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden group">
                    {media.type === 'image' ? (
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={media.url} className="w-full h-full object-cover" />
                    )}
                    
                    <button
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                
                <label className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-violet-500 hover:bg-slate-800/50 transition-colors">
                  <Plus className="w-6 h-6 text-slate-500" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Bottom Bar */}
            <div className="mx-6 my-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Media</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>
                
                <button 
                  onClick={() => setShowPreview(!showPreview)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    showPreview ? 'bg-violet-600/20 text-violet-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Preview</span>
                </button>
              </div>

              {/* Character Counter */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        charPercentage > 90 ? 'bg-rose-500' : charPercentage > 75 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(charPercentage, 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${charColor}`}>
                    {charCount}/{charLimit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Preview */}
          {showPreview && (
            <div className="w-80 border-l border-slate-800 bg-slate-900/30 p-6 overflow-y-auto">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Preview</h3>
              
              <div className="bg-black rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  {xAccounts[0]?.profileImageUrl ? (
                    <img 
                      src={xAccounts[0].profileImageUrl} 
                      alt=""
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-700 rounded-full" />
                  )}
                  <div>
                    <p className="text-white font-medium text-sm">{xAccounts[0]?.accountName || 'Your Name'}</p>
                    <p className="text-slate-500 text-xs">@{xAccounts[0]?.accountHandle || 'username'}</p>
                  </div>
                </div>
                
                <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {content ? renderFormattedText(content) : <span className="text-slate-600">Your post will appear here...</span>}
                </div>
                
                {mediaFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {mediaFiles.slice(0, 4).map((media, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-800">
                        {media.type === 'image' ? (
                          <img src={media.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <video src={media.url} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-3 flex items-center gap-4 text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-medium text-slate-300">Schedule</h3>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-2.5 pl-10 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                  
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-2.5 pl-10 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <button
            onClick={() => handlePost(true)}
            disabled={!content.trim() || !hasXConnected || isPosting || charCount > charLimit}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {isPosting ? 'Posting...' : 'Post Now'}
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isPosting}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handlePost(false)}
              disabled={!content.trim() || !hasXConnected || isPosting || charCount > charLimit}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
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
