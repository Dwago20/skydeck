"use client";

import { Database } from "lucide-react";
import { formatBytes, formatNumber } from "@/lib/utils";
import { providerColors, providerLabels } from "@/lib/constants";
import type { StorageBucket } from "@/lib/types";

interface BucketCardProps {
  bucket: StorageBucket;
}

export function BucketCard({ bucket }: BucketCardProps) {
  const color = providerColors[bucket.provider];

  return (
    <div className="glass-card glass-card-hover group overflow-hidden rounded-2xl p-4">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
              style={{ backgroundColor: `${color}12` }}
            >
              <Database className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-vault-200">
                {bucket.name}
              </h4>
              <p className="text-[11px] text-vault-500">
                {providerLabels[bucket.provider]} &middot; {bucket.region}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-vault-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-vault-500 ring-1 ring-vault-800">
            {bucket.storageClass}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-vault-800/40 pt-3">
          {[
            { value: formatBytes(bucket.sizeBytes), label: "Size" },
            { value: formatNumber(bucket.objectCount), label: "Objects" },
            { value: `$${bucket.monthlyCost.toFixed(2)}`, label: "$/mo" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-sm font-bold tracking-tight text-vault-200">{value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-vault-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
