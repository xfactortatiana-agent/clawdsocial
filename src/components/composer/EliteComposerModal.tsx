"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Calendar, 
  Clock, 
  Loader2,
  Wand2,
  Bold,
  Italic,
  Hash,
  AtSign,
  Plus,
  Trash2,
  GripVertical,
  Send,
  Save,
  Zap,
  MoreHorizontal,
  Check,
  AlertCircle,
  Type,
  MessageSquarePlus,
  Wand,
  Flame,
  Scissors,
  ListOrdered,
  Smile,
  Link as LinkIcon,
  BarChart3,
  Eye,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share,
  Upload,
  XCircle,
  ChevronRight,
  Lightbulb,
  Target,
  TrendingUp,
  Palette,
  FileText,
  History,
  Users,
  Lock,
  Globe,
  CalendarClock,
  Sparkle
} from "lucide-react";

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  connectedAccounts?: any[];
  editingPost?: any | null;
}

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif';
  file?: File;
  name: string;
  size: number;
}

interface AIAction {
  id: string;
  label: string;
  icon: any;
  description: string;
  prompt: string;
}

interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
  domain: string;
}

interface EmojiCategory {
  name: string;
  emojis: string[];
}

const AI_ACTIONS: AIAction[] = [
  { id: 'generate', label: 'Write for me', icon: Sparkles, description: 'Generate content from scratch', prompt: 'Write an engaging post about' },
  { id: 'rephrase', label: 'Rephrase', icon: Wand, description: 'Say it differently', prompt: 'Rephrase this content to make it more engaging' },
  { id: 'expand', label: 'Expand', icon: MessageSquarePlus, description: 'Add more detail', prompt: 'Expand on this with more details and context' },
  { id: 'shorten', label: 'Shorten', icon: Scissors, description: 'Make it concise', prompt: 'Make this more concise while keeping the key message' },
  { id: 'hook', label: 'Add Hook', icon: Target, description: 'Grab attention', prompt: 'Add a compelling hook to grab attention in the first line' },
  { id: 'thread', label: 'To Thread', icon: ListOrdered, description: 'Split into tweets', prompt: 'Convert this into a thread of connected tweets' },
  { id: 'hashtags', label: 'Hashtags', icon: Hash, description: 'Add relevant tags', prompt: 'Suggest relevant hashtags for this content' },
  { id: 'emoji', label: 'Add Emoji', icon: Smile, description: 'Enhance with emojis', prompt: 'Add appropriate emojis to enhance this content' },
];

const EMOJI_CATEGORIES: EmojiCategory[] = [
  { name: 'Recent', emojis: ['🔥', '⚡️', '💥', '🚀', '💫', '✨', '🌟', '💪'] },
  { name: 'Reactions', emojis: ['❤️', '👍', '🎉', '🤯', '👏', '🔥', '💯', '😂', '🤔', '😍', '🙄', '💀'] },
  { name: 'Objects', emojis: ['💡', '🎯', '📊', '💰', '🔑', '📈', '🎉', '🎁', '🏆', '⭐', '💎', '🚀'] },
  { name: 'Nature', emojis: ['🌟', '✨', '🔥', '💧', '🌊', '☀️', '🌙', '⚡', '❄️', '🌈', '🌸', '🌺'] },
];

const CONTENT_TEMPLATES = [
  { id: 'hot-take', name: 'Hot Take', icon: Flame, desc: 'Share a bold opinion' },
  { id: 'story', name: 'Story Time', icon: BookIcon, desc: 'Tell a personal story' },
  { id: 'tips', name: 'Quick Tips', icon: Lightbulb, desc: 'Share actionable advice' },
  { id: 'poll', name: 'Poll Question', icon: BarChart3, desc: 'Ask for opinions' },
  { id: 'milestone', name: 'Milestone', icon: TrendingUp, desc: 'Celebrate a win' },
  { id: 'behind-scenes', name: 'Behind Scenes', icon: Eye, desc: 'Show your process' },
];

function BookIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
  );
}

export function EliteComposerModal({ isOpen, onClose, initialDate, connectedAccounts = [], editingPost }: ComposerModalProps) {
  // Content state
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'analytics'>('write');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  // Scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [bestTimes, setBestTimes] = useState<any[]>([]);
  
  // Post status
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const xAccount = connectedAccounts.find(a => a.platform === 'X');
  const charCount = content.length;
  const charLimit = 280;
  const isOverLimit = charCount > charLimit;
  
  // Reset on open
  useEffect(() => {
    if (isOpen) {
      if (editingPost) {
        setContent(editingPost.content || '');
        setMedia(editingPost.media || []);
        if (editingPost.scheduledFor) {
          setIsScheduled(true);
          setScheduledDate(format(new Date(editingPost.scheduledFor), 'yyyy-MM-dd'));
          setScheduledTime(format(new Date(editingPost.scheduledFor), 'HH:mm'));
        }
      } else {
        resetComposer();
      }
    }
  }, [isOpen, editingPost]);
  
  const resetComposer = () => {
    setContent('');
    setMedia([]);
    setLinkPreview(null);
    setIsScheduled(false);
    setScheduledDate(format(new Date(), 'yyyy-MM-dd'));
    setScheduledTime('09:00');
    setAiSuggestions([]);
    setPostStatus(null);
  };
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);
  
  // Extract links for preview
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    if (urls && urls.length > 0) {
      // In production, fetch link preview from API
      // For now, mock it
      const url = urls[0];
      setLinkPreview({
        url,
        title: 'Link Preview',
        description: 'This would show the actual page preview',
        domain: new URL(url).hostname
      });
    } else {
      setLinkPreview(null);
    }
  }, [content]);
  
  const handleAIAction = async (action: AIAction) => {
    if (!aiPrompt.trim() && !content.trim()) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action.id,
          content: content || aiPrompt,
          prompt: action.prompt
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (action.id === 'thread') {
          setAiSuggestions(data.suggestions || []);
        } else {
          setContent(data.content || data.result || '');
        }
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      
      setMedia(prev => [...prev, {
        id: Math.random().toString(36),
        url,
        type,
        file,
        name: file.name,
        size: file.size
      }]);
    });
  };
  
  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };
  
  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };
  
  const applyTemplate = (templateId: string) => {
    const templates: Record<string, string> = {
      'hot-take': "Hot take: [Your bold opinion]\n\nI know this might be controversial, but...",
      'story': "Story time 🧵\n\nA few years ago, I learned a valuable lesson about...",
      'tips': "3 quick tips for [topic]:\n\n1. \n2. \n3. \n\nWhich one helps you most?",
      'poll': "Quick poll: [Your question]\n\n🟢 Option A\n🔵 Option B\n🟡 Option C\n\nVote below! 👇",
      'milestone': "🎉 Milestone reached!\n\nJust hit [achievement]. Couldn't have done it without...",
      'behind-scenes': "Behind the scenes 👀\n\nHere's what actually goes into [your process]..."
    };
    
    setContent(templates[templateId] || '');
    setShowTemplates(false);
  };
  
  const handlePublish = async () => {
    if (!content.trim() || isOverLimit) return;
    
    setIsPosting(true);
    setPostStatus(null);
    
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          mediaUrls: media.map(m => m.url),
          scheduledFor: isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : null,
          platform: 'X'
        })
      });
      
      if (res.ok) {
        setPostStatus({
          type: 'success',
          message: isScheduled ? 'Post scheduled!' : 'Post published!'
        });
        setTimeout(() => onClose(), 1500);
      } else {
        setPostStatus({ type: 'error', message: 'Failed to publish' });
      }
    } catch (err) {
      setPostStatus({ type: 'error', message: 'Network error' });
    } finally {
      setIsPosting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">
              {editingPost ? 'Edit Post' : 'Create Post'}
            </h2>
            
            {/* Platform Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
              <span className="text-xl">𝕏</span>
              <span className="text-sm text-slate-300">X (Twitter)</span>
              <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              {(['write', 'preview', 'analytics'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800">
              <button
                onClick={() => setContent(c => c + '**bold**')}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => setContent(c => c + '*italic*')}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-slate-700 mx-1" />
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-lg transition-colors ${showEmojiPicker ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                title="Add Media"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={`p-2 rounded-lg transition-colors ${showTemplates ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Templates"
              >
                <FileText className="w-4 h-4" />
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showAIPanel 
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                AI Assistant
              </button>
            </div>
            
            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Templates Panel */}
              {showTemplates && (
                <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">Content Templates</h3>
                    <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CONTENT_TEMPLATES.map(template => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template.id)}
                        className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors"
                      >
                        <template.icon className="w-5 h-5 text-violet-400 mb-2" />
                        <p className="text-sm font-medium text-white">{template.name}</p>
                        <p className="text-xs text-slate-500">{template.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">Emojis</h3>
                    <button onClick={() => setShowEmojiPicker(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {EMOJI_CATEGORIES.map(cat => (
                      <div key={cat.name}>
                        <p className="text-xs text-slate-500 mb-1">{cat.name}</p>
                        <div className="flex flex-wrap gap-1">
                          {cat.emojis.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => insertEmoji(emoji)}
                              className="w-8 h-8 hover:bg-slate-700 rounded flex items-center justify-center text-lg"
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
              
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className="w-full bg-transparent text-white text-lg placeholder-slate-600 resize-none focus:outline-none min-h-[200px]"
                style={{ minHeight: '200px' }}
              />
              
              {/* Link Preview */}
              {linkPreview && (
                <div className="mt-4 p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                      <LinkIcon className="w-6 h-6 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{linkPreview.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{linkPreview.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{linkPreview.domain}</p>
                    </div>
                    <button onClick={() => setLinkPreview(null)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Media Grid */}
              {media.length > 0 && (
                <div className={`mt-4 grid gap-2 ${media.length === 1 ? 'grid-cols-1' : media.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {media.map((file, idx) => (
                    <div key={file.id} className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 group">
                      {file.type === 'video' ? (
                        <video src={file.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={file.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => removeMedia(file.id)}
                        className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
              <div className="flex items-center gap-4">
                {/* Character Counter */}
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isOverLimit ? 'bg-rose-500' : charCount > 250 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min((charCount / charLimit) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${isOverLimit ? 'text-rose-400' : 'text-slate-400'}`}>
                    {charCount}/{charLimit}
                  </span>
                </div>
                
                {/* Schedule Toggle */}
                <button
                  onClick={() => setIsScheduled(!isScheduled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isScheduled ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {isScheduled ? 'Scheduled' : 'Schedule'}
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {/* Save draft */}}
                  className="px-4 py-2 text-slate-400 hover:text-white font-medium"
                >
                  Save Draft
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!content.trim() || isOverLimit || isPosting}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isScheduled ? 'Scheduling...' : 'Publishing...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {isScheduled ? 'Schedule' : 'Post Now'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Panel - AI / Preview / Analytics */}
          <div className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col">
            {showAIPanel ? (
              /* AI Panel */
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-5 h-5 text-violet-400" />
                  <h3 className="font-semibold text-white">AI Assistant</h3>
                </div>
                
                {/* AI Prompt Input */}
                <div className="mb-4">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="What would you like to write about?"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                
                {/* AI Actions Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {AI_ACTIONS.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleAIAction(action)}
                      disabled={isGenerating}
                      className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all disabled:opacity-50"
                    >
                      <action.icon className="w-4 h-4 text-violet-400 mb-2" />
                      <p className="text-sm font-medium text-white">{action.label}</p>
                      <p className="text-xs text-slate-500">{action.description}</p>
                    </button>
                  ))}
                </div>
                
                {/* AI Suggestions */}
                {aiSuggestions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-slate-500">Suggestions:</p>
                    {aiSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setContent(suggestion)}
                        className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-xl text-left text-sm text-slate-300 transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'preview' ? (
              /* Preview Panel */
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="font-semibold text-white mb-4">Preview</h3>
                
                {xAccount ? (
                  <div className="bg-black rounded-2xl border border-slate-800 overflow-hidden">
                    {/* X Post Preview */}
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {xAccount.profileImageUrl ? (
                          <img src={xAccount.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-700 rounded-full" />
                        )}
                        <div>
                          <p className="text-white font-medium text-sm">{xAccount.accountName || 'Your Name'}</p>
                          <p className="text-slate-500 text-xs">@{xAccount.accountHandle || 'username'}</p>
                        </div>
                      </div>
                      
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap mb-3">
                        {content || <span className="text-slate-600">Your post will appear here...</span>}
                      </p>
                      
                      {/* Media Preview */}
                      {media.length > 0 && (
                        <div className={`mb-3 grid gap-1 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {media.slice(0, 4).map((file, idx) => (
                            <div key={file.id} className="aspect-video rounded-lg overflow-hidden bg-slate-800">
                              {file.type === 'video' ? (
                                <video src={file.url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={file.url} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Engagement Bar */}
                      <div className="flex items-center justify-between text-slate-500 text-xs">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Repeat2 className="w-4 h-4" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>0</span>
                        </div>
                        <Share className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>Connect your X account to see preview</p>
                  </div>
                )}
              </div>
            ) : (
              /* Analytics Panel */
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="font-semibold text-white mb-4">Post Analytics</h3>
                
                <div className="space-y-4">
                  {/* Predicted Performance */}
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                    <p className="text-sm text-slate-400 mb-3">Predicted Performance</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Reach</span>
                          <span className="text-emerald-400">Good</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-emerald-400 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Engagement</span>
                          <span className="text-amber-400">Average</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full w-1/2 bg-amber-400 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Best Time */}
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                    <p className="text-sm text-slate-400 mb-2">Best Time to Post</p>
                    <p className="text-lg font-semibold text-white">Today, 6:00 PM</p>
                    <p className="text-xs text-slate-500">Your audience is most active</p>
                  </div>
                  
                  {/* Tips */}
                  <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-violet-400" />
                      <p className="text-sm font-medium text-violet-300">AI Tip</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      Posts with images get 2x more engagement. Consider adding media!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Schedule Panel (Bottom) */}
        {isScheduled && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              <div className="flex-1" />
              <span className="text-xs text-slate-500">Best times based on your audience</span>
            </div>
          </div>
        )}
        
        {/* Status Toast */}
        {postStatus && (
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium ${
            postStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {postStatus.message}
          </div>
        )}
      </div>
    </div>
  );
}
