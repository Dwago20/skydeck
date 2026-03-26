"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import type { CloudProvider } from "@/lib/types";
import { providerLabels, providerColors } from "@/lib/constants";

interface ProviderCardProps {
  provider: CloudProvider;
  instances: number;
  buckets: number;
  monthlyCost: number;
  status: "connected" | "configured" | "not_configured";
}

const statusConfig = {
  connected: { icon: CheckCircle, label: "Connected", textClass: "text-emerald-accent", bgClass: "bg-emerald-accent/8 ring-emerald-accent/15" },
  configured: { icon: AlertCircle, label: "Configured", textClass: "text-amber-accent", bgClass: "bg-amber-accent/8 ring-amber-accent/15" },
  not_configured: { icon: XCircle, label: "Not Set Up", textClass: "text-vault-500", bgClass: "bg-vault-900 ring-vault-800" },
};

export function ProviderCard({
  provider,
  instances,
  buckets,
  monthlyCost,
  status,
}: ProviderCardProps) {
  const color = providerColors[provider];
  const sc = statusConfig[status];
  const StatusIcon = sc.icon;

  return (
    <div className="glass-card glass-card-hover group relative h-full overflow-hidden rounded-2xl p-4">
      <div
        className="absolute left-0 top-0 h-full w-[3px] rounded-r-full transition-all duration-500 group-hover:w-[4px]"
        style={{ backgroundColor: color }}
      />

      <div className="ml-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-vault-200">
            {providerLabels[provider]}
          </h4>
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
              sc.bgClass, sc.textClass
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {sc.label}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { val: instances, label: "Instances" },
            { val: buckets, label: "Buckets" },
            { val: `$${monthlyCost.toFixed(0)}`, label: "$/mo" },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-bold tracking-tight text-vault-200">{val}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-vault-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
