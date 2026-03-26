"use client";

import { Bell, Server, HardDrive, Shield, Network, Activity, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: string;
  type: string;
  action: string;
  message: string;
  createdAt: string;
}

const typeIcons: Record<string, typeof Activity> = {
  instance: Server,
  storage: HardDrive,
  security: Shield,
  network: Network,
};

const typeColors: Record<string, string> = {
  instance: "text-cyan-accent bg-cyan-accent/8",
  storage: "text-violet-accent bg-violet-accent/8",
  security: "text-emerald-accent bg-emerald-accent/8",
  network: "text-amber-accent bg-amber-accent/8",
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRead, setLastRead] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("skydeck-last-read");
    if (stored) setLastRead(stored);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activity?limit=10");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      console.error("Failed to fetch activity");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchLogs();
  };

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem("skydeck-last-read", now);
    setLastRead(now);
  };

  const unreadCount = lastRead
    ? logs.filter((l) => new Date(l.createdAt) > new Date(lastRead)).length
    : logs.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-vault-500 transition-colors hover:bg-vault-900 hover:text-vault-300"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-accent px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-vault-800/60 bg-white/90 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-vault-800/40 px-4 py-3">
            <h3 className="text-sm font-semibold text-vault-200">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-medium text-cyan-accent hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-vault-500 hover:bg-vault-900 hover:text-vault-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-vault-700 border-t-cyan-accent" />
              </div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-sm text-vault-500">
                No activity yet
              </div>
            ) : (
              logs.map((log) => {
                const Icon = typeIcons[log.type] || Activity;
                const colorClass = typeColors[log.type] || "text-vault-500 bg-vault-900";
                const isUnread = lastRead ? new Date(log.createdAt) > new Date(lastRead) : true;

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-start gap-3 border-b border-vault-800/20 px-4 py-3 transition-colors last:border-0 hover:bg-vault-950",
                      isUnread && "bg-cyan-accent/[0.02]"
                    )}
                  >
                    <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", colorClass)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-vault-300">
                        {log.message}
                      </p>
                      <p className="mt-1 text-[11px] text-vault-500">
                        {timeAgo(log.createdAt)}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-accent" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
