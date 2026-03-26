"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useApi } from "@/lib/api";
import { providerLabels } from "@/lib/constants";
import type { CloudProvider } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface CostData {
  provider: string;
  compute: number;
  storage: number;
  network: number;
  other: number;
}

interface CostsResponse {
  costs: CostData[];
}

export function CostChart() {
  const { data, loading } = useApi<CostsResponse>("/api/costs");

  const chartData = (data?.costs || [])
    .filter((c) => c.compute + c.storage + c.network + c.other > 0)
    .map((c) => ({
      provider: providerLabels[c.provider as CloudProvider] || c.provider,
      Compute: c.compute,
      Storage: c.storage,
      Network: c.network,
      Other: c.other,
    }));

  return (
    <div className="glass-card overflow-hidden rounded-2xl p-5">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-vault-200">
          Cost Breakdown by Provider
        </h3>
        <p className="mt-0.5 text-[11px] text-vault-500">Monthly estimated spend (USD)</p>
      </div>

      <div className="h-[260px]">
        {loading || !chartData.length ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-accent/40" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="provider" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#334155",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                  padding: "10px 14px",
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`]}
                labelStyle={{ color: "#64748b", marginBottom: "4px" }}
                cursor={{ fill: "rgba(14, 165, 233, 0.04)" }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px", color: "#64748b", paddingBottom: "8px" }} />
              <Bar dataKey="Compute" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="Storage" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="Network" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="Other" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
