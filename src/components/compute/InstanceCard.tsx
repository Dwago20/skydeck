"use client";

import { Play, Square, Cpu, MemoryStick, Globe, Lock } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { providerColors, providerLabels, statusColors } from "@/lib/constants";
import type { CloudInstance } from "@/lib/types";

interface InstanceCardProps {
  instance: CloudInstance;
}

export function InstanceCard({ instance }: InstanceCardProps) {
  const color = providerColors[instance.provider];
  const sColor = statusColors[instance.status];

  return (
    <div className="glass-card glass-card-hover group overflow-hidden rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
              style={{ backgroundColor: `${color}12` }}
            >
              <Cpu className="h-5 w-5" style={{ color }} />
            </div>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                instance.status === "running" && "status-dot-running"
              )}
              style={{ backgroundColor: sColor }}
            />
          </div>
          <div>
            <h4 className="text-sm font-bold text-vault-200">
              {instance.name}
            </h4>
            <p className="font-mono text-[11px] text-vault-500">
              {instance.id}
            </p>
          </div>
        </div>

        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `${sColor}12`,
            color: sColor,
          }}
        >
          {instance.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-2 text-vault-400">
          <Cpu className="h-3 w-3 text-vault-600" />
          <span>{instance.cpu} vCPU &middot; {instance.memory} GB</span>
        </div>
        <div className="flex items-center gap-2 text-vault-400">
          <MemoryStick className="h-3 w-3 text-vault-600" />
          <span className="font-mono">{instance.type}</span>
        </div>
        <div className="flex items-center gap-2 text-vault-400">
          {instance.publicIp ? (
            <>
              <Globe className="h-3 w-3 text-vault-600" />
              <span className="font-mono">{instance.publicIp}</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 text-vault-600" />
              <span className="font-mono">{instance.privateIp}</span>
            </>
          )}
        </div>
        <div className="text-vault-500">
          {instance.region} &middot; {timeAgo(instance.launchTime)}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-vault-800/40 pt-3">
        <div className="flex items-center gap-2">
          <div
            className="rounded-lg px-2 py-0.5 text-[10px] font-bold"
            style={{
              backgroundColor: `${color}12`,
              color,
            }}
          >
            {providerLabels[instance.provider]}
          </div>
          {instance.monthlyCost > 0 && (
            <span className="text-xs font-medium text-vault-500">
              ${instance.monthlyCost.toFixed(2)}/mo
            </span>
          )}
        </div>

        <div className="flex gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
          {instance.status === "stopped" ? (
            <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-accent/10 text-emerald-accent ring-1 ring-emerald-accent/15 transition-all hover:bg-emerald-accent/20">
              <Play className="h-3.5 w-3.5" />
            </button>
          ) : instance.status === "running" ? (
            <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-accent/10 text-amber-accent ring-1 ring-amber-accent/15 transition-all hover:bg-amber-accent/20">
              <Square className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
