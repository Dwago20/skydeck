"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  accentColor?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "cyan-accent",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "glass-card glass-card-hover group relative overflow-hidden rounded-2xl p-5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-vault-500">
            {title}
          </p>
          <p className="animate-count-up text-[28px] font-bold leading-none tracking-tight text-vault-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] leading-relaxed text-vault-500">{subtitle}</p>
          )}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110"
          style={{
            backgroundColor: `color-mix(in srgb, var(--color-${accentColor}) 10%, white)`,
          }}
        >
          <Icon
            className="h-5 w-5 transition-all duration-500"
            style={{ color: `var(--color-${accentColor})` }}
          />
        </div>
      </div>

      {trend && (
        <div className="relative z-10 mt-4 flex items-center gap-1.5 border-t border-vault-800/40 pt-3">
          {trend.value >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-accent" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-rose-accent" />
          )}
          <span
            className={cn(
              "text-xs font-bold",
              trend.value >= 0 ? "text-emerald-accent" : "text-rose-accent"
            )}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-[11px] text-vault-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
