"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X, Sparkles, Image as ImageIcon, Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
}

const platforms = [
  { id: "x", name: "X (Twitter)", icon: "𝕏", color: "bg-slate-900" },
  { id: "instagram", name: "Instagram", icon: "📷", color: "bg-gradient-to-br from-purple-600 to-pink-500" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "bg-blue-600" },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "bg-black" },
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    setCharCount(text.length);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setContent("🚀 Excited to share what we've been building! \n\nAI-powered social media management that actually understands your brand voice. \n\nNo more generic posts. No more scheduling headaches. \n\nJust great content, delivered at the perfect time. \n\nWhat would you automate first? 👇");
    setCharCount(content.length);
    setIsGenerating(false);
  };

  const handleSave = () => {
    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    console.log("Saving post:", {
      content,
      platform,
      scheduledFor,
    });
    onClose();
  };

  const selectedPlatform = platforms.find((p) => p.id === platform);
  const charLimit = platform === "x" ? 280 : 2200;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Create Post</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Platform Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedPlatform?.icon}</span>
                    <span>{selectedPlatform?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.icon}</span>
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Content</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            <Textarea
              value={content}
              onChange={handleContentChange}
              placeholder="What would you like to share?"
              className="min-h-[160px] resize-none"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Use @ to mention, # for hashtags</span>
              <span
                className={`font-medium ${
                  charCount > charLimit ? "text-red-500" : "text-slate-500"
                }`}
              >
                {charCount}/{charLimit}
              </span>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Media</label>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Add Image</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-600">🎬 Add Video</span>
              </button>
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Schedule</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative w-32">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <Button variant="outline" onClick={onClose}>
            Save as Draft
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!content.trim()}
              className="gap-2"
            >
              <span>Schedule Post</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
