"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ResourceChart } from "@/components/dashboard/ResourceChart";
import { Server, Cpu, DollarSign, Activity, Play, Square, Loader2, MemoryStick, Globe, Lock, Filter } from "lucide-react";
import { useApi, apiPatch } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { providerColors, providerLabels, statusColors } from "@/lib/constants";
import type { CloudProvider, InstanceStatus } from "@/lib/types";

interface ProviderData { id: string; name: string; label: string; }

interface InstanceData {
  id: string;
  externalId: string;
  name: string;
  type: string;
  status: string;
  region: string;
  publicIp: string | null;
  privateIp: string;
  cpu: number;
  memory: number;
  monthlyCost: number;
  launchTime: string;
  provider: ProviderData;
}

interface ComputeResponse {
  instances: InstanceData[];
  stats: { total: number; running: number; stopped: number; totalCpu: number; totalMemory: number; totalCost: number };
}

type ProviderFilter = "all" | CloudProvider;
type StatusFilter = "all" | InstanceStatus;

export default function ComputePage() {
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { data, loading, refetch } = useApi<ComputeResponse>("/api/compute");

  const instances = data?.instances || [];
  const stats = data?.stats || { total: 0, running: 0, stopped: 0, totalCpu: 0, totalMemory: 0, totalCost: 0 };

  const filtered = instances.filter((inst) => {
    if (providerFilter !== "all" && inst.provider.name !== providerFilter) return false;
    if (statusFilter !== "all" && inst.status !== statusFilter) return false;
    return true;
  });

  const handleAction = async (id: string, action: "start" | "stop") => {
    setActionLoading(id);
    try {
      await apiPatch("/api/compute", { id, action });
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const providers: { value: ProviderFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "aws", label: "AWS" },
    { value: "azure", label: "Azure" },
    { value: "digitalocean", label: "DO" },
    { value: "alibaba", label: "Alibaba" },
  ];

  const statuses: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "running", label: "Running" },
    { value: "stopped", label: "Stopped" },
    { value: "terminated", label: "Terminated" },
  ];

  if (loading) {
    return (
      <>
        <Header title="Compute" subtitle="Manage instances across cloud providers" />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-accent/60" />
            <p className="text-sm text-vault-500">Loading compute instances...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Compute" subtitle="Manage instances across cloud providers" />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-in-scale stagger-1">
            <StatsCard title="Instances" value={`${stats.running} / ${stats.total}`} subtitle={`${stats.running} running`} icon={Server} accentColor="cyan-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-2">
            <StatsCard title="Total vCPUs" value={String(stats.totalCpu)} subtitle="Across running instances" icon={Cpu} accentColor="violet-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-3">
            <StatsCard title="Total Memory" value={`${stats.totalMemory} GB`} subtitle="Across running instances" icon={Activity} accentColor="emerald-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-4">
            <StatsCard title="Compute Cost" value={`$${stats.totalCost.toFixed(2)}/mo`} icon={DollarSign} accentColor="amber-accent" />
          </div>
        </div>

        <div className="animate-fade-in stagger-5">
          <ResourceChart title="Compute Utilization (24h)" subtitle="CPU, Memory, Network across all running instances" />
        </div>

        <div className="animate-fade-in stagger-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-vault-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-vault-500">Filters</span>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-white/60 p-1 ring-1 ring-vault-800/40 backdrop-blur-sm">
            {providers.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setProviderFilter(value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300",
                  providerFilter === value
                    ? "bg-cyan-accent/10 text-cyan-accent ring-1 ring-cyan-accent/20"
                    : "text-vault-500 hover:bg-vault-900 hover:text-vault-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-white/60 p-1 ring-1 ring-vault-800/40 backdrop-blur-sm">
            {statuses.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300",
                  statusFilter === value
                    ? "bg-cyan-accent/10 text-cyan-accent ring-1 ring-cyan-accent/20"
                    : "text-vault-500 hover:bg-vault-900 hover:text-vault-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="ml-auto rounded-full bg-vault-900 px-3 py-1 text-[11px] font-medium text-vault-500">
            {filtered.length} instance{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((instance, i) => {
            const color = providerColors[instance.provider.name as CloudProvider] || "#666";
            const sColor = statusColors[instance.status as InstanceStatus] || "#666";
            const isLoading = actionLoading === instance.id;

            return (
              <div key={instance.id} className={`animate-fade-in-scale stagger-${(i % 6) + 1}`}>
                <div className="glass-card glass-card-hover group h-full overflow-hidden rounded-2xl p-4">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105" style={{ backgroundColor: `${color}12` }}>
                            <Cpu className="h-5 w-5" style={{ color }} />
                          </div>
                          <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white", instance.status === "running" && "status-dot-running")} style={{ backgroundColor: sColor }} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-vault-200">{instance.name}</h4>
                          <p className="font-mono text-[11px] text-vault-500">{instance.externalId}</p>
                        </div>
                      </div>
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${sColor}12`, color: sColor }}>
                        {instance.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex items-center gap-2 text-vault-400">
                        <Cpu className="h-3 w-3 text-vault-600" /><span>{instance.cpu} vCPU &middot; {instance.memory} GB</span>
                      </div>
                      <div className="flex items-center gap-2 text-vault-400">
                        <MemoryStick className="h-3 w-3 text-vault-600" /><span className="font-mono">{instance.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-vault-400">
                        {instance.publicIp ? (<><Globe className="h-3 w-3 text-vault-600" /><span className="font-mono">{instance.publicIp}</span></>) : (<><Lock className="h-3 w-3 text-vault-600" /><span className="font-mono">{instance.privateIp}</span></>)}
                      </div>
                      <div className="text-vault-500">{instance.region} &middot; {timeAgo(new Date(instance.launchTime))}</div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-vault-800/40 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${color}12`, color }}>
                          {providerLabels[instance.provider.name as CloudProvider] || instance.provider.label}
                        </div>
                        {instance.monthlyCost > 0 && <span className="text-xs font-medium text-vault-500">${instance.monthlyCost.toFixed(2)}/mo</span>}
                      </div>
                      <div className="flex gap-1">
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-vault-500" />
                        ) : instance.status === "stopped" ? (
                          <button onClick={() => handleAction(instance.id, "start")} className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-accent/10 text-emerald-accent ring-1 ring-emerald-accent/15 transition-all hover:bg-emerald-accent/20">
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        ) : instance.status === "running" ? (
                          <button onClick={() => handleAction(instance.id, "stop")} className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-accent/10 text-amber-accent ring-1 ring-amber-accent/15 transition-all hover:bg-amber-accent/20">
                            <Square className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Server className="h-8 w-8 text-vault-700" />
              <p className="text-sm text-vault-500">No instances match the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
