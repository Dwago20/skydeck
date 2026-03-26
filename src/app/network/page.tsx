"use client";

import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Network, Globe, Lock, Shield, Layers, Loader2, ArrowDown, ArrowUp } from "lucide-react";
import { useApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { providerColors, providerLabels } from "@/lib/constants";
import type { CloudProvider } from "@/lib/types";

interface SubnetData {
  id: string;
  name: string;
  cidr: string;
  availabilityZone: string;
  isPublic: boolean;
  instanceCount: number;
}

interface SecurityGroupData {
  id: string;
  name: string;
  provider: string;
  inboundRules: number;
  outboundRules: number;
}

interface VpcData {
  id: string;
  name: string;
  provider: string;
  cidr: string;
  region: string;
  status: string;
  subnets: SubnetData[];
  securityGroups: SecurityGroupData[];
}

interface NetworkResponse {
  vpcs: VpcData[];
  stats: {
    totalVpcs: number;
    totalSubnets: number;
    publicSubnets: number;
    privateSubnets: number;
    totalSecurityGroups: number;
  };
}

export default function NetworkPage() {
  const { data, loading } = useApi<NetworkResponse>("/api/network");

  if (loading || !data) {
    return (
      <>
        <Header title="Network" subtitle="VPCs, subnets, and security groups" />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-accent/60" />
            <p className="text-sm text-vault-500">Loading network topology...</p>
          </div>
        </div>
      </>
    );
  }

  const { vpcs, stats } = data;

  return (
    <>
      <Header title="Network" subtitle="VPCs, subnets, and security groups" />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-in-scale stagger-1">
            <StatsCard title="VPCs" value={String(stats.totalVpcs)} icon={Network} accentColor="cyan-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-2">
            <StatsCard title="Subnets" value={String(stats.totalSubnets)} subtitle={`${stats.publicSubnets} public, ${stats.privateSubnets} private`} icon={Layers} accentColor="violet-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-3">
            <StatsCard title="Security Groups" value={String(stats.totalSecurityGroups)} icon={Shield} accentColor="emerald-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-4">
            <StatsCard title="Regions" value="2" subtitle="ap-southeast-1, Southeast Asia" icon={Globe} accentColor="amber-accent" />
          </div>
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-vault-500">
            <span className="h-px flex-1 bg-gradient-to-r from-vault-800 to-transparent" />
            Virtual Private Clouds
            <span className="h-px flex-1 bg-gradient-to-l from-vault-800 to-transparent" />
          </h3>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {vpcs.map((vpc, vi) => {
              const color = providerColors[vpc.provider as CloudProvider] || "#666";
              return (
                <div key={vpc.id} className={`animate-fade-in-scale stagger-${vi + 1}`}>
                  <div className="glass-card group overflow-hidden rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
                          style={{ backgroundColor: `${color}12` }}
                        >
                          <Network className="h-5 w-5" style={{ color }} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-vault-200">{vpc.name}</h4>
                          <p className="font-mono text-[11px] text-vault-500">{vpc.id} &middot; {vpc.cidr}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: `${color}12`, color }}
                        >
                          {providerLabels[vpc.provider as CloudProvider] || vpc.provider}
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-emerald-accent/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-accent ring-1 ring-emerald-accent/15">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-accent status-dot-running" />
                          {vpc.status}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-vault-500">
                        Subnets ({vpc.subnets.length})
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {vpc.subnets.map((subnet) => (
                          <div
                            key={subnet.id}
                            className="flex items-center gap-3 rounded-xl border border-vault-800/30 bg-vault-950/60 px-3 py-2.5 transition-all duration-300 hover:border-vault-700 hover:bg-vault-900/60"
                          >
                            <div className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                              subnet.isPublic ? "bg-cyan-accent/8" : "bg-amber-accent/8"
                            )}>
                              {subnet.isPublic ? (
                                <Globe className="h-3.5 w-3.5 text-cyan-accent" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 text-amber-accent" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-vault-300">{subnet.name}</p>
                              <p className="font-mono text-[10px] text-vault-500">{subnet.cidr} &middot; {subnet.availabilityZone}</p>
                            </div>
                            <div className="shrink-0 rounded-full bg-vault-900 px-2 py-0.5 text-[10px] font-medium text-vault-500">
                              {subnet.instanceCount} inst.
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {vpc.securityGroups.length > 0 && (
                      <div className="mt-4 border-t border-vault-800/40 pt-4">
                        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-vault-500">
                          Security Groups ({vpc.securityGroups.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {vpc.securityGroups.map((sg) => (
                            <div
                              key={sg.id}
                              className="flex items-center gap-2 rounded-xl border border-vault-800/30 bg-vault-950/60 px-3 py-2 transition-all duration-300 hover:border-emerald-accent/20 hover:bg-vault-900/60"
                            >
                              <Shield className="h-3.5 w-3.5 text-emerald-accent" />
                              <span className="text-xs font-medium text-vault-300">{sg.name}</span>
                              <div className="flex items-center gap-1.5 text-vault-500">
                                <span className="flex items-center gap-0.5 font-mono text-[10px]">
                                  <ArrowDown className="h-2.5 w-2.5 text-cyan-accent" />
                                  {sg.inboundRules}
                                </span>
                                <span className="flex items-center gap-0.5 font-mono text-[10px]">
                                  <ArrowUp className="h-2.5 w-2.5 text-amber-accent" />
                                  {sg.outboundRules}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
