"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  eachDayOfInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
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

const platformColors = {
  x: "bg-slate-900 text-white",
  instagram: "bg-gradient-to-br from-purple-600 to-pink-500 text-white",
  linkedin: "bg-blue-600 text-white",
  tiktok: "bg-black text-white",
};

const statusColors = {
  draft: "border-slate-300 bg-slate-50",
  scheduled: "border-blue-400 bg-blue-50",
  published: "border-green-400 bg-green-50",
  failed: "border-red-400 bg-red-50",
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
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => onDateClick?.(selectedDate || new Date())}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
          <span className="text-slate-600">Draft</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
          <span className="text-slate-600">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
          <span className="text-slate-600">Published</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
          <span className="text-slate-600">Failed</span>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
          >
            {day}
          </div>
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
                "min-h-[120px] p-2 border-b border-r border-slate-100 cursor-pointer transition-colors",
                !isCurrentMonth && "bg-slate-50/50 text-slate-400",
                isCurrentMonth && "bg-white hover:bg-slate-50",
                isToday && "bg-blue-50/30",
                isSelected && "ring-2 ring-inset ring-slate-900",
                dayIdx % 7 === 6 && "border-r-0" // Last column
              )}
            >
              {/* Date Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isToday
                      ? "bg-slate-900 text-white"
                      : isCurrentMonth
                      ? "text-slate-700"
                      : "text-slate-400"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayPosts.length > 0 && (
                  <span className="text-xs font-medium text-slate-500">
                    {dayPosts.length} post{dayPosts.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Posts */}
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPostClick?.(post);
                    }}
                    className={cn(
                      "px-2 py-1.5 rounded text-xs border-l-2 truncate cursor-pointer hover:opacity-80 transition-opacity",
                      statusColors[post.status]
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          platformColors[post.platform].split(" ")[0]
                        )}
                      />
                      <span className="truncate font-medium text-slate-700">
                        {post.content.slice(0, 30)}...
                      </span>
                    </div>
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-slate-500 pl-2">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>

              {/* Empty State */}
              {dayPosts.length === 0 && isCurrentMonth && (
                <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                    <Plus className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
