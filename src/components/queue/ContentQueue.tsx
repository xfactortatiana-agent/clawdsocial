"use client";

import { useState, useEffect } from "react";
import { 
  Clock, 
  Calendar,
  Settings,
  Play,
  Pause,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  Sparkles,
  Repeat,
  FileText
} from "lucide-react";
import { format, addDays, setHours, setMinutes } from "date-fns";

interface TimeSlot {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  minute: number; // 0-59
}

interface ContentQueue {
  id: string;
  name: string;
  isActive: boolean;
  timeSlots: TimeSlot[];
  useEvergreen: boolean;
  useAiDrafts: boolean;
  useTemplates: boolean;
  maxPerDay: number;
  minInterval: number;
}

interface QueueItem {
  id: string;
  scheduledSlot: string;
  status: 'PENDING' | 'READY' | 'SCHEDULED' | 'PUBLISHED';
  sourceType?: 'TEMPLATE' | 'EVERGREEN' | 'AI_GENERATED';
}

interface ContentQueueProps {
  workspaceId: string;
  accountId: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ContentQueueManager({ workspaceId, accountId }: ContentQueueProps) {
  const [queue, setQueue] = useState<ContentQueue | null>(null);
  const [upcomingItems, setUpcomingItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Settings form state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { day: 1, hour: 9, minute: 0 },
    { day: 3, hour: 14, minute: 30 },
    { day: 5, hour: 18, minute: 0 }
  ]);
  const [useEvergreen, setUseEvergreen] = useState(false);
  const [useAiDrafts, setUseAiDrafts] = useState(true);
  const [maxPerDay, setMaxPerDay] = useState(3);

  useEffect(() => {
    fetchQueue();
  }, [workspaceId, accountId]);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/queue?workspaceId=${workspaceId}&accountId=${accountId}`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue);
        setUpcomingItems(data.upcomingItems || []);
        if (data.queue) {
          setTimeSlots(data.queue.timeSlots || []);
          setUseEvergreen(data.queue.useEvergreen);
          setUseAiDrafts(data.queue.useAiDrafts);
          setMaxPerDay(data.queue.maxPerDay);
        }
      }
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveQueueSettings = async () => {
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          accountId,
          name: 'Default Queue',
          timeSlots,
          useEvergreen,
          useAiDrafts,
          useTemplates: true,
          maxPerDay,
          minInterval: 60
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue);
        setShowSettings(false);
      }
    } catch (error) {
      console.error("Failed to save queue:", error);
    }
  };

  const generateQueueItems = async () => {
    setIsGenerating(true);
    try {
      // Generate items for the next 7 days based on time slots
      const items = [];
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = addDays(today, i);
        const dayOfWeek = date.getDay();
        
        // Find slots for this day
        const daySlots = timeSlots.filter(s => s.day === dayOfWeek);
        
        for (const slot of daySlots.slice(0, maxPerDay)) {
          const scheduledTime = setMinutes(setHours(date, slot.hour), slot.minute);
          items.push({
            scheduledSlot: scheduledTime.toISOString(),
            status: 'PENDING',
            sourceType: useAiDrafts ? 'AI_GENERATED' : 'TEMPLATE'
          });
        }
      }

      // TODO: Save these items to the queue
      await fetchQueue();
    } catch (error) {
      console.error("Failed to generate queue:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addTimeSlot = () => {
    setTimeSlots(prev => [...prev, { day: 1, hour: 12, minute: 0 }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: number) => {
    setTimeSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Content Queue</h3>
          <p className="text-sm text-slate-400">
            {queue?.isActive ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Auto-scheduling active
              </span>
            ) : (
              'Set up automatic content scheduling'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          
          {queue?.isActive && (
            <button
              onClick={generateQueueItems}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 text-white rounded-lg transition-colors"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Fill Queue
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
          <p className="text-2xl font-bold text-white">{upcomingItems.length}</p>
          <p className="text-sm text-slate-400">Upcoming Posts</p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
          <p className="text-2xl font-bold text-white">{timeSlots.length}</p>
          <p className="text-sm text-slate-400">Time Slots</p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
          <p className="text-2xl font-bold text-white">{maxPerDay}</p>
          <p className="text-sm text-slate-400">Max/Day</p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
          <p className="text-2xl font-bold text-white">{useEvergreen ? 'On' : 'Off'}</p>
          <p className="text-sm text-slate-400">Evergreen</p>
        </div>
      </div>

      {/* Upcoming Queue */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h4 className="font-medium text-white">Upcoming Scheduled Posts</h4>
        </div>
        
        <div className="divide-y divide-slate-800">
          {upcomingItems.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No upcoming posts in queue</p>
              <p className="text-sm text-slate-500 mt-1">
                Click "Fill Queue" to auto-generate content
              </p>
            </div>
          ) : (
            upcomingItems.map(item => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.status === 'SCHEDULED' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {item.status === 'SCHEDULED' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-white font-medium">
                      {format(new Date(item.scheduledSlot), 'MMM d, yyyy h:mm a')}
                    </p>
                    <p className="text-sm text-slate-400">
                      {item.sourceType === 'AI_GENERATED' && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Generated</span>}
                      {item.sourceType === 'EVERGREEN' && <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> Evergreen</span>}
                      {item.sourceType === 'TEMPLATE' && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Template</span>}
                    </p>
                  </div>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.status === 'SCHEDULED' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : item.status === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
                >
                  {item.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Queue Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Time Slots</label>
                <div className="space-y-2">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={slot.day}
                        onChange={(e) => updateTimeSlot(index, 'day', parseInt(e.target.value))}
                        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      >
                        {DAYS.map((day, i) => (
                          <option key={i} value={i}>{day}</option>
                        ))}
                      </select>
                      
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={slot.hour}
                        onChange={(e) => updateTimeSlot(index, 'hour', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      />
                      <span className="text-slate-500">:</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={slot.minute}
                        onChange={(e) => updateTimeSlot(index, 'minute', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      />
                      
                      <button
                        onClick={() => removeTimeSlot(index)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={addTimeSlot}
                  className="mt-3 flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
                >
                  <Plus className="w-4 h-4" />
                  Add Time Slot
                </button>
              </div>
              
              {/* Content Sources */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">Content Sources</label>
                
                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAiDrafts}
                    onChange={(e) => setUseAiDrafts(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <p className="text-white text-sm">AI-Generated Drafts</p>
                    <p className="text-xs text-slate-400">Generate fresh content with AI</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useEvergreen}
                    onChange={(e) => setUseEvergreen(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <p className="text-white text-sm">Evergreen Content</p>
                    <p className="text-xs text-slate-400">Recycle top-performing posts</p>
                  </div>
                </label>
              </div>
              
              {/* Limits */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Posts Per Day: {maxPerDay}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-slate-400 hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveQueueSettings}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
