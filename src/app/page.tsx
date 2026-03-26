"use client";

import { Server, HardDrive, Network, DollarSign, Activity, Shield, Loader2, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ResourceChart } from "@/components/dashboard/ResourceChart";
import { CostChart } from "@/components/dashboard/CostChart";
import { ProviderCard } from "@/components/dashboard/ProviderCard";
import { useApi } from "@/lib/api";
import { formatBytes } from "@/lib/utils";

interface ProviderData {
  id: string;
  name: string;
  label: string;
  status: string;
}

interface InstanceData {
  id: string;
  name: string;
  status: string;
  monthlyCost: number;
  provider: ProviderData;
}

interface BucketData {
  id: string;
  name: string;
  sizeBytes: string | bigint;
  objectCount: number;
  monthlyCost: number;
  provider: ProviderData;
}

interface AssetsResponse {
  instances: InstanceData[];
  buckets: BucketData[];
  providers: ProviderData[];
}

interface NetworkResponse {
  vpcs: { id: string; subnets: { id: string }[] }[];
  stats: { totalVpcs: number; totalSubnets: number };
}

interface ActivityLog {
  id: string;
  type: string;
  action: string;
  message: string;
  createdAt: string;
}

interface ActivityResponse {
  logs: ActivityLog[];
}

const typeIcons: Record<string, typeof Activity> = {
  instance: Server,
  storage: HardDrive,
  security: Shield,
  network: Network,
};

const typeColors: Record<string, { text: string; bg: string }> = {
  instance: { text: "text-cyan-accent", bg: "bg-cyan-accent/8" },
  storage: { text: "text-violet-accent", bg: "bg-violet-accent/8" },
  security: { text: "text-emerald-accent", bg: "bg-emerald-accent/8" },
  network: { text: "text-amber-accent", bg: "bg-amber-accent/8" },
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

export default function DashboardPage() {
  const { data: assets, loading: assetsLoading } = useApi<AssetsResponse>("/api/assets");
  const { data: network, loading: netLoading } = useApi<NetworkResponse>("/api/network");
  const { data: activityData } = useApi<ActivityResponse>("/api/activity?limit=5");

  const loading = assetsLoading || netLoading;

  if (loading || !assets) {
    return (
      <>
        <Header title="Dashboard" subtitle="Multi-cloud infrastructure overview" />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-accent/60" />
            <p className="text-sm text-vault-500">Loading infrastructure data...</p>
          </div>
        </div>
      </>
    );
  }

  const instances = assets.instances || [];
  const buckets = assets.buckets || [];
  const running = instances.filter((i) => i.status === "running").length;
  const totalStorage = buckets.reduce((s, b) => s + Number(b.sizeBytes), 0);
  const totalCost = instances.reduce((s, i) => s + i.monthlyCost, 0) + buckets.reduce((s, b) => s + b.monthlyCost, 0);
  const activityLogs = activityData?.logs || [];

  const providerStats = (name: string) => ({
    instances: instances.filter((i) => i.provider.name === name).length,
    buckets: buckets.filter((b) => b.provider.name === name).length,
    cost: instances.filter((i) => i.provider.name === name).reduce((s, i) => s + i.monthlyCost, 0)
      + buckets.filter((b) => b.provider.name === name).reduce((s, b) => s + b.monthlyCost, 0),
    status: (assets.providers.find((p) => p.name === name)?.status || "not_configured") as "connected" | "configured" | "not_configured",
  });

  const aws = providerStats("aws");
  const azure = providerStats("azure");
  const doo = providerStats("digitalocean");
  const alibaba = providerStats("alibaba");

  return (
    <>
      <Header title="Dashboard" subtitle="Multi-cloud infrastructure overview" />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-in-scale stagger-1">
            <StatsCard title="Compute Instances" value={`${running} / ${instances.length}`} subtitle={`${running} running`} icon={Server} trend={{ value: 12, label: "vs last month" }} accentColor="cyan-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-2">
            <StatsCard title="Total Storage" value={formatBytes(totalStorage)} subtitle={`${buckets.length} buckets across providers`} icon={HardDrive} trend={{ value: 8, label: "vs last month" }} accentColor="violet-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-3">
            <StatsCard title="Network" value={`${network?.stats.totalVpcs || 0} VPCs`} subtitle={`${network?.stats.totalSubnets || 0} subnets configured`} icon={Network} accentColor="emerald-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-4">
            <StatsCard title="Monthly Cost" value={`$${totalCost.toFixed(2)}`} subtitle="Estimated across all providers" icon={DollarSign} trend={{ value: -3, label: "vs last month" }} accentColor="amber-accent" />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-vault-500">
            Cloud Providers
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProviderCard provider="aws" instances={aws.instances} buckets={aws.buckets} monthlyCost={aws.cost} status={aws.status} />
            <ProviderCard provider="azure" instances={azure.instances} buckets={azure.buckets} monthlyCost={azure.cost} status={azure.status} />
            <ProviderCard provider="digitalocean" instances={doo.instances} buckets={doo.buckets} monthlyCost={doo.cost} status={doo.status} />
            <ProviderCard provider="alibaba" instances={alibaba.instances} buckets={alibaba.buckets} monthlyCost={alibaba.cost} status={alibaba.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ResourceChart title="Resource Utilization (24h)" subtitle="Aggregate CPU, Memory, and Network across all instances" />
          <CostChart />
        </div>

        <div className="glass-card overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-vault-800/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-vault-500" />
              <h3 className="text-sm font-semibold text-vault-200">Recent Activity</h3>
            </div>
          </div>
          <div className="divide-y divide-vault-800/30">
            {activityLogs.length === 0 ? (
              <div className="py-8 text-center text-sm text-vault-500">No recent activity</div>
            ) : (
              activityLogs.map((log) => {
                const Icon = typeIcons[log.type] || Activity;
                const colors = typeColors[log.type] || { text: "text-vault-500", bg: "bg-vault-900" };
                return (
                  <div
                    key={log.id}
                    className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-vault-950"
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                    </div>
                    <p className="flex-1 text-sm text-vault-400 transition-colors group-hover:text-vault-200">
                      {log.message}
                    </p>
                    <span className="shrink-0 text-[11px] text-vault-500">
                      {timeAgo(log.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
