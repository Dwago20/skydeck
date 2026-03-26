"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface UsageData {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

interface UsageResponse {
  usage: UsageData[];
}

interface ResourceChartProps {
  title: string;
  subtitle?: string;
}

export function ResourceChart({ title, subtitle }: ResourceChartProps) {
  const { data, loading } = useApi<UsageResponse>("/api/usage");

  return (
    <div className="glass-card overflow-hidden rounded-2xl p-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-vault-200">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-vault-500">{subtitle}</p>
          )}
        </div>
        <div className="flex gap-1">
          {["1h", "6h", "24h", "7d"].map((period, i) => (
            <button
              key={period}
              className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-all duration-200 ${
                i === 2
                  ? "bg-cyan-accent/10 text-cyan-accent ring-1 ring-cyan-accent/20"
                  : "text-vault-500 hover:bg-vault-900 hover:text-vault-300"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[260px]">
        {loading || !data?.usage?.length ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-accent/40" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.usage} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#334155",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                  padding: "10px 14px",
                }}
                formatter={(value) => [`${Number(value).toFixed(1)}%`]}
                labelStyle={{ color: "#64748b", marginBottom: "4px" }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px", color: "#64748b", paddingBottom: "8px" }} />
              <Area type="monotone" dataKey="cpu" name="CPU" stroke="#0ea5e9" strokeWidth={2} fill="url(#cpuGrad)" dot={false} activeDot={{ r: 4, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }} />
              <Area type="monotone" dataKey="memory" name="Memory" stroke="#8b5cf6" strokeWidth={2} fill="url(#memGrad)" dot={false} activeDot={{ r: 4, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }} />
              <Area type="monotone" dataKey="network" name="Network" stroke="#10b981" strokeWidth={1.5} fill="url(#netGrad)" dot={false} activeDot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
