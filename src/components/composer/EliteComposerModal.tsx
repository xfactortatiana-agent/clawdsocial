"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { 
  X, Sparkles, Image as ImageIcon, Calendar, Clock, Loader2,
  Bold, Italic, Hash, AtSign, Send, Save, Wand2, Smile,
  BarChart3, Eye, ThumbsUp, MessageCircle, Repeat2, Share,
  Flame, Scissors, ListOrdered, Target, Zap, ChevronDown,
  Type, Link as LinkIcon, AlertCircle
} from "lucide-react";

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  connectedAccounts?: any[];
  editingPost?: any | null;
  analytics?: any;
}

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  file?: File;
}

const EMOJIS = ['🔥', '⚡️', '💥', '🚀', '💫', '✨', '🌟', '💪', '❤️', '👍', '🎉', '🤯', '👏', '💯', '😂', '🤔', '😍', '💡', '🎯', '📊', '💰', '🔑', '📈', '🎁', '🏆', '⭐', '💎'];

export function EliteComposerModal({ isOpen, onClose, initialDate, connectedAccounts = [], editingPost, analytics }: ComposerModalProps) {
  const [content, setContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const xAccount = connectedAccounts.find(a => a.platform === 'X');
  const charCount = content.length;
  const charLimit = 280;
  const isOverLimit = charCount > charLimit;
  
  // Calculate real predicted performance
  const predictedPerformance = calculatePredictedPerformance(content, media, analytics, xAccount);
  
  useEffect(() => {
    if (isOpen && editingPost) {
      setContent(editingPost.content || '');
      setMedia(editingPost.media || []);
      if (editingPost.scheduledFor) {
        setIsScheduled(true);
        setScheduledDate(format(new Date(editingPost.scheduledFor), 'yyyy-MM-dd'));
        setScheduledTime(format(new Date(editingPost.scheduledFor), 'HH:mm'));
      }
    } else if (isOpen) {
      resetComposer();
    }
  }, [isOpen, editingPost]);
  
  const resetComposer = () => {
    setContent('');
    setMedia([]);
    setIsScheduled(false);
    setPostStatus(null);
  };
  
  // Rich text formatting using execCommand for visual editing
  const toggleBold = () => {
    document.execCommand('bold', false);
    updateActiveStates();
    updateContentFromEditor();
  };
  
  const toggleItalic = () => {
    document.execCommand('italic', false);
    updateActiveStates();
    updateContentFromEditor();
  };
  
  const updateActiveStates = () => {
    setIsBoldActive(document.queryCommandState('bold'));
    setIsItalicActive(document.queryCommandState('italic'));
  };
  
  const updateContentFromEditor = () => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
      setContent(editorRef.current.innerText);
    }
  };
  
  const insertEmoji = (emoji: string) => {
    document.execCommand('insertText', false, emoji);
    updateContentFromEditor();
    setShowEmojiPicker(false);
  };
  
  // Media handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 4 - media.length).forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setMedia(prev => [...prev, { id: Math.random().toString(36), url, type, file }]);
    });
  };
  
  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };
  
  // AI Generation
  const handleAIAction = async (action: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content: content || aiPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || '');
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Publish
  const handlePublish = async () => {
    if (!content.trim() || isOverLimit) return;
    setIsPosting(true);
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
        setPostStatus({ type: 'success', message: isScheduled ? 'Scheduled!' : 'Published!' });
        setTimeout(onClose, 1500);
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
            <h2 className="text-lg font-semibold text-white">{editingPost ? 'Edit Post' : 'Create Post'}</h2>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
              <span className="text-xl">𝕏</span>
              <span className="text-sm text-slate-300">X (Twitter)</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left - Editor */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800">
              <button onClick={toggleBold} className={`p-2 rounded-lg transition-colors ${isBoldActive ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Bold className="w-4 h-4" /></button>
              <button onClick={toggleItalic} className={`p-2 rounded-lg transition-colors ${isItalicActive ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Italic className="w-4 h-4" /></button>
              <div className="w-px h-5 bg-slate-700 mx-1" />
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 rounded-lg transition-colors ${showEmojiPicker ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Smile className="w-4 h-4" /></button>
              <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><ImageIcon className="w-4 h-4" /></button>
              <div className="flex-1" />
              <button onClick={() => setShowAIPanel(!showAIPanel)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showAIPanel ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Wand2 className="w-4 h-4" />AI</button>
            </div>
            
            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {showEmojiPicker && (
                <div className="mb-4 p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  <div className="flex flex-wrap gap-1">{EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => insertEmoji(emoji)} className="w-8 h-8 hover:bg-slate-700 rounded flex items-center justify-center text-lg">{emoji}</button>
                  ))}</div>
                </div>
              )}
              
              <div
                ref={editorRef}
                contentEditable
                onInput={updateContentFromEditor}
                onKeyUp={updateActiveStates}
                onMouseUp={updateActiveStates}
                className="w-full min-h-[200px] bg-transparent text-white text-lg placeholder-slate-600 focus:outline-none"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.5' }}
                data-placeholder="What's happening?"
                suppressContentEditableWarning
              />
              
              {media.length > 0 && (
                <div className={`mt-4 grid gap-2 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {media.map(file => (
                    <div key={file.id} className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 group">
                      {file.type === 'video' ? <video src={file.url} className="w-full h-full object-cover" /> : <img src={file.url} alt="" className="w-full h-full object-cover" />}
                      <button onClick={() => removeMedia(file.id)} className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileUpload} className="hidden" />
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-rose-500' : charCount > 250 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min((charCount / charLimit) * 100, 100)}%` }} />
                  </div>
                  <span className={`text-sm font-medium ${isOverLimit ? 'text-rose-400' : 'text-slate-400'}`}>{charCount}/{charLimit}</span>
                </div>
                <button onClick={() => setIsScheduled(!isScheduled)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${isScheduled ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-white'}`}><Calendar className="w-4 h-4" />{isScheduled ? 'Scheduled' : 'Schedule'}</button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => {}} className="px-4 py-2 text-slate-400 hover:text-white font-medium">Save Draft</button>
                <button onClick={handlePublish} disabled={!content.trim() || isOverLimit || isPosting} className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-all flex items-center gap-2">
                  {isPosting ? <><Loader2 className="w-4 h-4 animate-spin" />{isScheduled ? 'Scheduling...' : 'Publishing...'}</> : <><Send className="w-4 h-4" />{isScheduled ? 'Schedule' : 'Post Now'}</>}
                </button>
              </div>
            </div>
          </div>
          
          {/* Right - Live Preview & Analytics */}
          <div className="w-96 bg-slate-900/50 flex flex-col overflow-y-auto">
            {/* Preview Card */}
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Live Preview</h3>
              {xAccount ? (
                <div className="bg-black rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {xAccount.profileImageUrl ? <img src={xAccount.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 bg-slate-700 rounded-full" />}
                      <div><p className="text-white font-bold text-sm">{xAccount.accountName || 'Your Name'}</p><p className="text-slate-500 text-sm">@{xAccount.accountHandle || 'username'}</p></div>
                    </div>
                    <div className="text-white text-[15px] leading-normal whitespace-pre-wrap mb-3" dangerouslySetInnerHTML={{ __html: htmlContent || '<span class="text-slate-600">Your post will appear here...</span>' }} />
                    
                    {media.length > 0 && (
                      <div className={`mb-3 grid gap-0.5 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} rounded-2xl overflow-hidden`}>
                        {media.slice(0, 4).map(file => (
                          <div key={file.id} className="aspect-video bg-slate-800">
                            {file.type === 'video' ? <video src={file.url} className="w-full h-full object-cover" /> : <img src={file.url} alt="" className="w-full h-full object-cover" />}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-slate-500 pt-2">
                      <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /><span className="text-xs">0</span></div>
                      <div className="flex items-center gap-1"><Repeat2 className="w-4 h-4" /><span className="text-xs">0</span></div>
                      <div className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /><span className="text-xs">0</span></div>
                      <div className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /><span className="text-xs">0</span></div>
                      <Share className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500"><p>Connect X to see preview</p></div>
              )}
            </div>
            
            {/* Real Predicted Performance */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-400">Predicted Performance</h3>
                {predictedPerformance.confidence < 0.3 && <span className="text-xs text-amber-400">Learning...</span>}
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-400">Estimated Reach</span><span className={getScoreColor(predictedPerformance.reachScore)}>{predictedPerformance.reachLabel}</span></div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${getScoreBgColor(predictedPerformance.reachScore)}`} style={{ width: `${predictedPerformance.reachScore}%` }} /></div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-400">Engagement Potential</span><span className={getScoreColor(predictedPerformance.engagementScore)}>{predictedPerformance.engagementLabel}</span></div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${getScoreBgColor(predictedPerformance.engagementScore)}`} style={{ width: `${predictedPerformance.engagementScore}%` }} /></div>
                </div>
                
                {predictedPerformance.estimatedImpressions > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Est. Impressions</span><span className="text-white font-medium">{predictedPerformance.estimatedImpressions.toLocaleString()}</span></div>
                    <div className="flex items-center justify-between text-sm mt-1"><span className="text-slate-400">Est. Engagements</span><span className="text-white font-medium">{predictedPerformance.estimatedEngagements.toLocaleString()}</span></div>
                  </div>
                )}
              </div>            
            </div>
            
            {/* AI Panel */}
            {showAIPanel && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4"><Wand2 className="w-5 h-5 text-violet-400" /><h3 className="font-semibold text-white">AI Assistant</h3></div>
                <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="What to write about?" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 resize-none h-20 mb-3" />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'generate', label: 'Write', icon: Sparkles },
                    { id: 'rephrase', label: 'Rephrase', icon: Type },
                    { id: 'expand', label: 'Expand', icon: MessageCircle },
                    { id: 'shorten', label: 'Shorten', icon: Scissors },
                    { id: 'hook', label: 'Add Hook', icon: Target },
                    { id: 'hashtags', label: 'Hashtags', icon: Hash },
                  ].map(action => (
                    <button key={action.id} onClick={() => handleAIAction(action.id)} disabled={isGenerating} className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all disabled:opacity-50">
                      <action.icon className="w-4 h-4 text-violet-400 mb-2" /><p className="text-sm font-medium text-white">{action.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Schedule Panel */}
        {isScheduled && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-4">
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm" />
              <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm" />
              <div className="flex-1" />
              <span className="text-xs text-slate-500">Best times based on your audience</span>
            </div>
          </div>
        )}
        
        {/* Status Toast */}
        {postStatus && (
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium ${postStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{postStatus.message}</div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function formatContentForPreview(content: string): string {
  if (!content) return '';
  // Convert URLs to links
  let formatted = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="text-blue-400 hover:underline" target="_blank" rel="noopener">$1</a>');
  // Convert hashtags
  formatted = formatted.replace(/#(\w+)/g, '<span class="text-blue-400">#$1</span>');
  // Convert mentions
  formatted = formatted.replace(/@(\w+)/g, '<span class="text-blue-400">@$1</span>');
  return formatted;
}

function calculatePredictedPerformance(content: string, media: MediaFile[], analytics: any, account: any) {
  // Default values
  let reachScore = 50;
  let engagementScore = 50;
  let confidence = 0;
  let estimatedImpressions = 0;
  let estimatedEngagements = 0;
  
  // If we have analytics data, use it
  if (analytics?.avgImpressions && analytics?.avgEngagementRate) {
    confidence = Math.min(analytics.postsAnalyzed / 20, 1); // Max confidence at 20 posts
    
    // Base estimates on historical performance
    estimatedImpressions = Math.round(analytics.avgImpressions);
    estimatedEngagements = Math.round(analytics.avgImpressions * analytics.avgEngagementRate);
    
    // Adjust based on content factors
    let contentMultiplier = 1;
    
    // Length factor - optimal is 100-200 chars
    if (content.length > 50 && content.length < 200) contentMultiplier += 0.1;
    if (content.length > 280) contentMultiplier -= 0.2;
    
    // Media factor
    if (media.length > 0) contentMultiplier += 0.15;
    if (media.length >= 2) contentMultiplier += 0.1;
    
    // Hashtag factor
    const hashtagCount = (content.match(/#/g) || []).length;
    if (hashtagCount >= 1 && hashtagCount <= 3) contentMultiplier += 0.05;
    
    // Question factor (engagement driver)
    if (content.includes('?')) contentMultiplier += 0.1;
    
    estimatedImpressions = Math.round(estimatedImpressions * contentMultiplier);
    estimatedEngagements = Math.round(estimatedEngagements * contentMultiplier);
    
    // Calculate scores (0-100)
    const followerCount = account?.followerCount || 1000;
    reachScore = Math.min(Math.round((estimatedImpressions / followerCount) * 100), 100);
    engagementScore = Math.min(Math.round(analytics.avgEngagementRate * 1000), 100);
  } else {
    // No data yet - use content-based heuristics
    confidence = 0;
    
    if (content.length > 0) {
      // Basic content scoring
      reachScore = 30;
      engagementScore = 30;
      
      if (content.length > 50) { reachScore += 10; engagementScore += 10; }
      if (media.length > 0) { reachScore += 15; engagementScore += 15; }
      if (content.includes('?')) engagementScore += 10;
      if ((content.match(/#/g) || []).length > 0) { reachScore += 5; engagementScore += 5; }
    }
  }
  
  return {
    reachScore,
    engagementScore,
    confidence,
    estimatedImpressions,
    estimatedEngagements,
    reachLabel: getScoreLabel(reachScore),
    engagementLabel: getScoreLabel(engagementScore),
  };
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  if (score >= 20) return 'Below Avg';
  return 'Low';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-rose-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 60) return 'bg-blue-400';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-rose-400';
}