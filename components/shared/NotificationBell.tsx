"use client";
/**
 * FIX #4 — In-app Notification Bell
 * Polls every 30s. Shows unread badge. Click to view + mark read.
 */
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  TASK_ASSIGNED:       "bg-sky-100 text-sky-600",
  TASK_APPROVED:       "bg-emerald-100 text-emerald-600",
  TASK_REWORK:         "bg-red-100 text-red-600",
  REPORT_SUBMITTED:    "bg-violet-100 text-violet-600",
  REPORT_FEEDBACK:     "bg-violet-100 text-violet-600",
  EVALUATION_COMPLETE: "bg-amber-100 text-amber-600",
  BATCH_STARTED:       "bg-sky-100 text-sky-600",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setUnreadCount(0);
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) load(); }}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n._id}
                  className={cn("px-4 py-3 hover:bg-slate-50 transition-colors", !n.read && "bg-sky-50/50")}>
                  <div className="flex items-start gap-3">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5",
                      TYPE_COLORS[n.type] || "bg-slate-100 text-slate-500")}>
                      {n.type.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-snug", n.read ? "text-slate-600" : "text-slate-800 font-medium")}>
                        {n.title}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-slate-300 text-[10px] mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  {n.link && (
                    <Link href={n.link}
                      className="mt-1.5 ml-10 text-xs text-sky-600 hover:underline flex items-center gap-1"
                      onClick={() => setOpen(false)}>
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
