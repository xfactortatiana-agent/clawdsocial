"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format, addMinutes, isBefore, startOfDay, addHours } from "date-fns";
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
  ChevronDown,
  ChevronUp,
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
  ListOrdered
} from "lucide-react";

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  connectedAccounts?: any[];
}

interface Tweet {
  id: string;
  content: string;
  media: { url: string; type: 'image' | 'video'; file?: File }[];
}

interface AIMode {
  type: 'generate' | 'improve' | 'thread' | 'hashtags' | null;
  prompt: string;
}

const emojis = {
  fire: ['🔥', '⚡️', '💥', '🚀', '💫', '✨', '🌟', '💪'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍'],
  faces: ['😀', '😂', '🤔', '😎', '🤯', '🥳', '😍', '🙄'],
  objects: ['💡', '🎯', '📊', '💰', '🔑', '📈', '🎉', '🎁'],
  gestures: ['👍', '👏', '🙌', '✌️', '🤝', '👆', '👇', '💯']
};

const bestTimes = [
  { label: 'Morning', time: '09:00', desc: '9:00 AM — High engagement' },
  { label: 'Lunch', time: '12:00', desc: '12:00 PM — Peak activity' },
  { label: 'Evening', time: '18:00', desc: '6:00 PM — Commute scroll' },
  { label: 'Night', time: '21:00', desc: '9:00 PM — Relaxation time' },
];

// Parse content with formatting
function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|#[\w]+|@[\w]+|https?:\/\/[^\s]+)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i} className="italic text-slate-200">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 bg-slate-700 rounded text-xs font-mono text-cyan-400">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('#') && part.length > 1) {
      return <span key={i} className="text-violet-400">{part}</span>;
    }
    if (part.startsWith('@') && part.length > 1) {
      return <span key={i} className="text-blue-400">{part}</span>;
    }
    if (part.startsWith('http')) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{part.length > 25 ? part.slice(0, 25) + '...' : part}</a>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function ComposerModal({ isOpen, onClose, initialDate, connectedAccounts = [] }: ComposerModalProps) {
  const [tweets, setTweets] = useState<Tweet[]>([{ id: '1', content: '', media: [] }]);
  const [activeTweetIndex, setActiveTweetIndex] = useState(0);
  const [isThread, setIsThread] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [postStatus, setPostStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiMode, setAiMode] = useState<AIMode>({ type: null, prompt: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  
  const textareaRefs = useRef<(Map<string, HTMLTextAreaElement>>(new Map());

  const xAccounts = connectedAccounts.filter(a => a.platform === 'X');
  const hasXConnected = xAccounts.length > 0;

  useEffect(() => {
    if (!isOpen) {
      resetComposer();
    }
  }, [isOpen]);

  const resetComposer = () => {
    setTweets([{ id: '1', content: '', media: [] }]);
    setActiveTweetIndex(0);
    setIsThread(false);
    setPostStatus(null);
    setShowAIPanel(false);
    setAiSuggestions([]);
    setScheduledDate(format(new Date(), "yyyy-MM-dd"));
    setScheduledTime("12:00");
  };

  const addTweet = () => {
    const newId = Date.now().toString();
    setTweets([...tweets, { id: newId, content: '', media: [] }]);
    setIsThread(true);
    setTimeout(() => {
      const newIndex = tweets.length;
      setActiveTweetIndex(newIndex);
      textareaRefs.current.get(newId)?.focus();
    }, 50);
  };

  const removeTweet = (index: number) => {
    if (tweets.length === 1) return;
    const newTweets = tweets.filter((_, i) => i !== index);
    setTweets(newTweets);
    if (newTweets.length === 1) setIsThread(false);
    if (activeTweetIndex >= newTweets.length) {
      setActiveTweetIndex(newTweets.length - 1);
    }
  };

  const moveTweet = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= tweets.length) return;
    const newTweets = [...tweets];
    const [moved] = newTweets.splice(fromIndex, 1);
    newTweets.splice(toIndex, 0, moved);
    setTweets(newTweets);
    setActiveTweetIndex(toIndex);
  };

  const updateTweetContent = (index: number, content: string) => {
    const newTweets = [...tweets];
    newTweets[index].content = content;
    setTweets(newTweets);
  };

  const addMedia = (index: number, files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      const newTweets = [...tweets];
      if (newTweets[index].media.length < 4) {
        newTweets[index].media.push({ url, type, file });
        setTweets(newTweets);
      }
    });
  };

  const removeMedia = (tweetIndex: number, mediaIndex: number) => {
    const newTweets = [...tweets];
    newTweets[tweetIndex].media.splice(mediaIndex, 1);
    setTweets(newTweets);
  };

  const insertText = (index: number, before: string, after: string = '') => {
    const textarea = textareaRefs.current.get(tweets[index].id);
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = tweets[index].content;
    const selectedText = content.substring(start, end);
    
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    updateTweetContent(index, newContent);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const toggleFormat = (index: number, format: 'bold' | 'italic') => {
    const textarea = textareaRefs.current.get(tweets[index].id);
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = tweets[index].content;
    const selectedText = content.substring(start, end);
    
    const marker = format === 'bold' ? '**' : '*';
    const beforeSelection = content.substring(Math.max(0, start - marker.length), start);
    const afterSelection = content.substring(end, Math.min(content.length, end + marker.length));
    
    // Check if already formatted
    const isFormatted = beforeSelection === marker && afterSelection === marker && 
      !(format === 'italic' && content.substring(Math.max(0, start - 2), start) === '**');
    
    if (isFormatted) {
      // Remove formatting
      const newContent = content.substring(0, start - marker.length) + selectedText + content.substring(end + marker.length);
      updateTweetContent(index, newContent);
    } else {
      // Add formatting
      insertText(index, marker, marker);
    }
  };

  const getCharCount = (content: string) => content.length;
  const getCharPercentage = (content: string) => (getCharCount(content) / 280) * 100;

  const handleAIAction = async () => {
    if (!aiMode.type || !aiMode.prompt.trim()) return;
    
    setIsGenerating(true);
    setAiSuggestions([]);

    try {
      const currentContent = tweets[activeTweetIndex].content;
      
      const res = await fetch('/api/ai/composer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: aiMode.type,
          prompt: aiMode.prompt,
          currentContent,
          isThread
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.suggestions) {
          setAiSuggestions(data.suggestions);
        } else if (data.content) {
          updateTweetContent(activeTweetIndex, data.content);
          setShowAIPanel(false);
        }
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyAISuggestion = (suggestion: string) => {
    updateTweetContent(activeTweetIndex, suggestion);
    setAiSuggestions([]);
    setAiMode({ type: null, prompt: '' });
  };

  const handlePublish = async (publishNow: boolean = false) => {
    if (!hasXConnected || tweets.every(t => !t.content.trim())) return;
    
    setIsPosting(true);
    setPostStatus(null);

    try {
      const scheduledFor = publishNow 
        ? null 
        : new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      // For threads, create multiple posts
      const posts = tweets.map((tweet, index) => ({
        content: tweet.content,
        media: tweet.media.map(m => m.file),
        threadPosition: isThread ? index : null,
        threadId: isThread ? tweets[0].id : null
      })).filter(p => p.content.trim());

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts,
          isThread,
          scheduledFor,
          platform: 'X'
        })
      });

      const data = await res.json();

      if (res.ok) {
        setPostStatus({
          type: 'success',
          message: publishNow 
            ? isThread ? 'Thread published!' : 'Post published!' 
            : isThread ? 'Thread scheduled!' : 'Post scheduled!'
        });
        setTimeout(() => onClose(), 1500);
      } else {
        setPostStatus({ type: 'error', message: data.error || 'Failed to publish' });
      }
    } catch (err) {
      setPostStatus({ type: 'error', message: 'Network error' });
    } finally {
      setIsPosting(false);
    }
  };

  const saveDraft = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/posts/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweets, isThread })
      });
      setPostStatus({ type: 'success', message: 'Draft saved!' });
    } catch (err) {
      setPostStatus({ type: 'error', message: 'Failed to save draft' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">{isThread ? 'Thread Composer' : 'Compose Post'}</h2>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-400">{tweets.length} {tweets.length === 1 ? 'tweet' : 'tweets'}</span>
              <button
                onClick={() => {
                  if (!isThread) {
                    setIsThread(true);
                    if (tweets.length === 1) addTweet();
                  }
                }}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isThread ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Thread
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showAIPanel ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">AI</span>
            </button>
            
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Editor */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Status */}
            {postStatus && (
              <div className={`mx-6 mt-4 px-4 py-3 rounded-xl ${
                postStatus.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20' 
                  : 'bg-rose-500/10 border border-rose-500/20'
              }`}>
                <p className={`text-sm ${postStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {postStatus.message}
                </p>
              </div>
            )}

            {/* Connected Account */}
            {hasXConnected && (
              <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                {xAccounts[0]?.profileImageUrl ? (
                  <img src={xAccounts[0].profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-emerald-600/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                <span className="text-sm text-emerald-400">@{xAccounts[0]?.accountHandle}</span>
              </div>
            )}

            {/* Tweets */}
            <div className="flex-1 p-6 space-y-4">
              {tweets.map((tweet, index) => (
                <div
                  key={tweet.id}
                  className={`relative bg-slate-800/50 border rounded-xl transition-all ${
                    activeTweetIndex === index 
                      ? 'border-violet-500/50 ring-1 ring-violet-500/20' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => setActiveTweetIndex(index)}
                >
                  {/* Thread connector */}
                  {isThread && index < tweets.length - 1 && (
                    <div className="absolute left-6 bottom-0 translate-y-full w-0.5 h-4 bg-slate-700" />
                  )}

                  <div className="p-4">
                    {/* Tweet Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {isThread && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveTweet(index, index - 1); }}
                              disabled={index === 0}
                              className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                            >
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            </button>
                            <span className="text-xs text-slate-500 font-mono">{index + 1}/{tweets.length}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveTweet(index, index + 1); }}
                              disabled={index === tweets.length - 1}
                              className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                            >
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Char counter */}
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                getCharPercentage(tweet.content) > 100 ? 'bg-rose-500' :
                                getCharPercentage(tweet.content) > 90 ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.min(getCharPercentage(tweet.content), 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            getCharCount(tweet.content) > 280 ? 'text-rose-400' :
                            getCharCount(tweet.content) > 250 ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                            {getCharCount(tweet.content)}/280
                          </span>
                        </div>

                        {tweets.length > 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeTweet(index); }}
                            className="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Editor Toolbar */}
                    <div className="flex items-center gap-1 mb-3 p-1 bg-slate-900/50 rounded-lg">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFormat(index, 'bold'); }}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFormat(index, 'italic'); }}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-700 mx-1" />
                      <button
                        onClick={(e) => { e.stopPropagation(); insertText(index, '@'); }}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                        title="Mention"
                      >
                        <AtSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); insertText(index, '#'); }}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                        title="Hashtag"
                      >
                        <Hash className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(showEmojiPicker === index ? null : index as any); }}
                          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                          title="Emoji"
                        >
                          <span className="text-lg">😊</span>
                        </button>
                        
                        {showEmojiPicker === index && (
                          <div className="absolute top-full left-0 mt-2 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 w-64">
                            <div className="space-y-2">
                              {Object.entries(emojis).map(([cat, list]) => (
                                <div key={cat}>
                                  <p className="text-[10px] text-slate-500 uppercase mb-1">{cat}</p>
                                  <div className="grid grid-cols-8 gap-1">
                                    {list.map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={(e) => { e.stopPropagation(); insertText(index, emoji, ''); setShowEmojiPicker(null); }}
                                        className="w-6 h-6 hover:bg-slate-700 rounded flex items-center justify-center"
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
                      
                      <label className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white cursor-pointer">
                        <ImageIcon className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={(e) => addMedia(index, e.target.files)}
                        />
                      </label>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={(el) => {
                        if (el) textareaRefs.current.set(tweet.id, el);
                      }}
                      value={tweet.content}
                      onChange={(e) => updateTweetContent(index, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={index === 0 ? "What's happening?" : `Tweet ${index + 1}...`}
                      className="w-full min-h-[100px] bg-transparent text-white placeholder-slate-500 resize-none focus:outline-none text-base leading-relaxed"
                    />

                    {/* Media Preview */}
                    {tweet.media.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {tweet.media.map((media, mIdx) => (
                          <div key={mIdx} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                            {media.type === 'image' ? (
                              <img src={media.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <video src={media.url} className="w-full h-full object-cover" />
                            )}
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); removeMedia(index, mIdx); }}
                              className="absolute top-1 right-1 w-5 h-5 bg-rose-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Tweet Button */}
              <button
                onClick={addTweet}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-700 hover:border-violet-500/50 rounded-xl text-slate-400 hover:text-violet-400 transition-colors w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add to thread</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar - AI Panel */}
          {showAIPanel && (
            <div className="w-80 border-l border-slate-800 bg-slate-900/30 flex flex-col">
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-violet-400" />
                  <h3 className="font-semibold text-white">AI Assistant</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* AI Modes */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'generate', icon: Sparkles, label: 'Write for me' },
                    { id: 'improve', icon: Flame, label: 'Make engaging' },
                    { id: 'thread', icon: ListOrdered, label: 'To thread' },
                    { id: 'hashtags', icon: Hash, label: 'Hashtags' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setAiMode({ type: mode.id as any, prompt: '' })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        aiMode.type === mode.id
                          ? 'bg-violet-600/20 border-violet-500 text-white'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <mode.icon className="w-4 h-4 mb-2" />
                      <p className="text-xs font-medium">{mode.label}</p>
                    </button>
                  ))}
                </div>

                {/* AI Input */}
                {aiMode.type && (
                  <div className="space-y-3">
                    <textarea
                      value={aiMode.prompt}
                      onChange={(e) => setAiMode({ ...aiMode, prompt: e.target.value })}
                      placeholder={
                        aiMode.type === 'generate' ? 'Topic or bullet points...' :
                        aiMode.type === 'improve' ? 'What to improve?' :
                        aiMode.type === 'thread' ? 'Convert current tweet to thread...' :
                        'Suggest hashtags for...'
                      }
                      className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    
                    <button
                      onClick={handleAIAction}
                      disabled={isGenerating || !aiMode.prompt.trim()}
                      className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* AI Suggestions */}
                {aiSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Suggestions:</p>
                    {aiSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyAISuggestion(suggestion)}
                        className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-xl text-left text-sm text-slate-300 transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schedule Panel */}
          {showSchedulePicker && !showAIPanel && (
            <div className="w-72 border-l border-slate-800 bg-slate-900/30 p-4">
              <h3 className="font-semibold text-white mb-4">Schedule</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Best times</p>
                  <div className="space-y-2">
                    {bestTimes.map((time) => (
                      <button
                        key={time.time}
                        onClick={() => setScheduledTime(time.time)}
                        className={`w-full p-2 rounded-lg text-left text-sm transition-colors ${
                          scheduledTime === time.time
                            ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{time.label}</span>
                          <span className="text-xs opacity-70">{time.time}</span>
                        </div>
                        <p className="text-xs opacity-60 mt-0.5">{time.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSchedulePicker(!showSchedulePicker)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                showSchedulePicker ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {showSchedulePicker ? 'Scheduling' : 'Schedule'}
            </button>
            
            <button
              onClick={saveDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Draft'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePublish(true)}
              disabled={isPosting || tweets.every(t => !t.content.trim())}
              className="px-4 py-2.5 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              {isPosting ? 'Publishing...' : 'Post Now'}
            </button>
            
            <button
              onClick={() => handlePublish(false)}
              disabled={isPosting || tweets.every(t => !t.content.trim()) || !showSchedulePicker}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
            >
              <Send className="w-4 h-4" />
              {isPosting ? 'Scheduling...' : showSchedulePicker ? 'Schedule' : 'Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
