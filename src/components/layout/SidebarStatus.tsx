"use client";

import { useApi } from "@/lib/api";

interface StatsData {
  providers: number;
}

export function SidebarStatus({ collapsed }: { collapsed: boolean }) {
  const { data } = useApi<StatsData>("/api/stats");
  const count = data?.providers ?? 0;

  return (
    <div className="mx-3 mb-3 rounded-xl border border-vault-800/40 bg-vault-950/60 p-3">
      {!collapsed ? (
        <div className="animate-fade-in space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative h-2 w-2 rounded-full bg-emerald-accent status-dot-running" />
            <span className="text-[11px] font-medium text-vault-400">
              All systems operational
            </span>
          </div>
          <p className="text-[10px] text-vault-500">
            {count} provider{count !== 1 ? "s" : ""} connected
          </p>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="h-2 w-2 rounded-full bg-emerald-accent status-dot-running" />
        </div>
      )}
    </div>
  );
}
