"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  eachDayOfInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  content: string;
  platform: "x" | "instagram" | "linkedin" | "tiktok";
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor: Date;
  accountName: string;
}

interface CalendarProps {
  posts?: Post[];
  onDateClick?: (date: Date) => void;
  onPostClick?: (post: Post) => void;
}

const statusColors = {
  draft: "border-slate-600 bg-slate-800/50",
  scheduled: "border-violet-500 bg-violet-500/10",
  published: "border-emerald-500 bg-emerald-500/10",
  failed: "border-rose-500 bg-rose-500/10",
};

export function VisualCalendar({ posts = [], onDateClick, onPostClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    posts.forEach((post) => {
      const dateKey = format(post.scheduledFor, "yyyy-MM-dd");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(post);
    });
    return map;
  }, [posts]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-800 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-800 rounded-lg">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
            Today
          </button>
          <button onClick={() => onDateClick?.(selectedDate || new Date())} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg">
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-800/50 text-xs">
        {[
          { color: "bg-slate-500", label: "Draft" },
          { color: "bg-violet-500", label: "Scheduled" },
          { color: "bg-emerald-500", label: "Published" },
          { color: "bg-rose-500", label: "Failed" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-800/50">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-slate-500 uppercase">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, dayIdx) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={cn(
                "min-h-[120px] p-2 border-b border-r border-slate-800/30 cursor-pointer",
                !isCurrentMonth && "bg-slate-950/50 text-slate-600",
                isCurrentMonth && "hover:bg-slate-800/30",
                isToday && "bg-violet-500/5",
                isSelected && "ring-2 ring-inset ring-violet-500",
                dayIdx % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isToday ? "bg-violet-600 text-white" : isCurrentMonth ? "text-slate-300" : "text-slate-600"
                )}>
                  {format(day, "d")}
                </span>
                {dayPosts.length > 0 && (
                  <span className="text-xs text-slate-500">{dayPosts.length} post{dayPosts.length !== 1 ? "s" : ""}</span>
                )}
              </div>

              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    onClick={(e) => { e.stopPropagation(); onPostClick?.(post); }}
                    className={cn("px-2 py-1.5 rounded text-xs border-l-2 truncate cursor-pointer", statusColors[post.status])}
                  >
                    <span className="text-slate-300 truncate">{post.content.slice(0, 25)}...</span>
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-slate-500 pl-2">+{dayPosts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
