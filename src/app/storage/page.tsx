"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { FileUpload } from "@/components/storage/FileUpload";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { HardDrive, FileBox, Database, DollarSign, Loader2, File, FileText, Image, Download, Trash2 } from "lucide-react";
import { useApi, apiDelete } from "@/lib/api";
import { formatBytes, formatNumber, timeAgo } from "@/lib/utils";
import { providerColors, providerLabels } from "@/lib/constants";
import type { CloudProvider } from "@/lib/types";

interface ProviderData { id: string; name: string; label: string; }

interface BucketData {
  id: string;
  name: string;
  region: string;
  sizeBytes: string;
  objectCount: number;
  storageClass: string;
  monthlyCost: number;
  provider: ProviderData;
}

interface FileData {
  id: string;
  key: string;
  sizeBytes: string;
  contentType: string;
  lastModified: string;
  bucket: { name: string };
  provider: ProviderData;
}

interface AssetsResponse {
  buckets: BucketData[];
  files: FileData[];
}

function fileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return Image;
  if (contentType === "application/pdf") return FileText;
  return File;
}

export default function StoragePage() {
  const { data, loading, refetch } = useApi<AssetsResponse>("/api/assets?type=all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  if (loading || !data) {
    return (
      <>
        <Header title="Storage" subtitle="Manage buckets and files across cloud providers" />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-violet-accent/60" />
            <p className="text-sm text-vault-500">Loading storage data...</p>
          </div>
        </div>
      </>
    );
  }

  const buckets = data.buckets || [];
  const files = data.files || [];
  const totalSize = buckets.reduce((s, b) => s + Number(b.sizeBytes), 0);
  const totalObjects = buckets.reduce((s, b) => s + b.objectCount, 0);
  const totalCost = buckets.reduce((s, b) => s + b.monthlyCost, 0);

  const handleDelete = async (file: FileData) => {
    if (!confirm(`Delete "${file.key.split("/").pop()}" from ${file.bucket.name}?`)) return;

    const fileId = `${file.bucket.name}-${file.key}`;
    setDeleting(fileId);
    try {
      const isAzure = file.provider.name === "azure";
      const provider = isAzure ? "azure" : "aws";
      const params = isAzure
        ? new URLSearchParams({ container: file.bucket.name, blob: file.key })
        : new URLSearchParams({ bucket: file.bucket.name, key: file.key });
      await apiDelete(`/api/storage/${provider}?${params}`);
      await refetch();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (file: FileData) => {
    const fileId = `${file.bucket.name}-${file.key}`;
    setDownloading(fileId);
    try {
      const provider = file.provider.name === "azure" ? "azure" : "aws";
      const params = new URLSearchParams({ bucket: file.bucket.name, key: file.key, action: "download" });
      const res = await fetch(`/api/storage/${provider}?${params}`);
      const data = await res.json();

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert("Download not available in demo mode — connect a cloud provider to enable downloads.");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <Header title="Storage" subtitle="Manage buckets and files across cloud providers" />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-in-scale stagger-1">
            <StatsCard title="Buckets" value={String(buckets.length)} icon={Database} accentColor="cyan-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-2">
            <StatsCard title="Total Size" value={formatBytes(totalSize)} icon={HardDrive} accentColor="violet-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-3">
            <StatsCard title="Total Objects" value={formatNumber(totalObjects)} icon={FileBox} accentColor="emerald-accent" />
          </div>
          <div className="animate-fade-in-scale stagger-4">
            <StatsCard title="Storage Cost" value={`$${totalCost.toFixed(2)}/mo`} icon={DollarSign} accentColor="amber-accent" />
          </div>
        </div>

        <div className="animate-fade-in stagger-3">
          <FileUpload />
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-vault-500">
            <span className="h-px flex-1 bg-gradient-to-r from-vault-800 to-transparent" />
            Buckets ({buckets.length})
            <span className="h-px flex-1 bg-gradient-to-l from-vault-800 to-transparent" />
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {buckets.map((bucket, i) => {
              const color = providerColors[bucket.provider.name as CloudProvider] || "#666";
              return (
                <div key={bucket.id} className={`animate-fade-in-scale stagger-${(i % 6) + 1}`}>
                  <div className="glass-card glass-card-hover group relative h-full overflow-hidden rounded-2xl p-4">
                    <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.06] transition-opacity duration-700 group-hover:opacity-[0.12]" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105" style={{ backgroundColor: `${color}12` }}>
                            <Database className="h-5 w-5" style={{ color }} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-vault-200">{bucket.name}</h4>
                            <p className="text-[11px] text-vault-500">{providerLabels[bucket.provider.name as CloudProvider] || bucket.provider.label} &middot; {bucket.region}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-vault-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-vault-500 ring-1 ring-vault-800">{bucket.storageClass}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-vault-800/40 pt-3">
                        {[
                          { value: formatBytes(Number(bucket.sizeBytes)), label: "Size" },
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
                </div>
              );
            })}
          </div>
        </div>

        <div className="animate-fade-in glass-card overflow-hidden rounded-2xl">
          <div className="border-b border-vault-800/40 px-5 py-4">
            <h3 className="text-sm font-bold text-vault-200">Recent Files</h3>
            <p className="mt-0.5 text-[11px] text-vault-500">{files.length} files across providers</p>
          </div>
          <div className="divide-y divide-vault-800/30">
            {files.length === 0 ? (
              <div className="py-8 text-center text-sm text-vault-500">No files uploaded yet</div>
            ) : (
              files.map((file) => {
                const Icon = fileIcon(file.contentType);
                const fileName = file.key.split("/").pop() || file.key;
                const filePath = file.key.split("/").slice(0, -1).join("/");
                const color = providerColors[file.provider.name as CloudProvider] || "#666";
                const fileId = `${file.bucket.name}-${file.key}`;
                const isDeleting = deleting === fileId;
                const isDownloading = downloading === fileId;

                return (
                  <div key={file.id} className="group flex items-center gap-4 px-5 py-3 transition-all duration-300 hover:bg-vault-900/60">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-vault-900 ring-1 ring-vault-800/50 transition-all duration-300 group-hover:scale-105">
                      <Icon className="h-4 w-4 text-vault-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-vault-300 transition-colors group-hover:text-vault-100">{fileName}</p>
                      <p className="truncate text-[11px] text-vault-500">{filePath ? `${filePath} · ` : ""}{file.bucket.name}</p>
                    </div>
                    <div className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${color}12`, color }}>
                      {providerLabels[file.provider.name as CloudProvider] || file.provider.label}
                    </div>
                    <div className="w-20 shrink-0 text-right text-xs font-medium text-vault-500">{formatBytes(Number(file.sizeBytes))}</div>
                    <div className="w-16 shrink-0 text-right text-[11px] text-vault-600">{timeAgo(new Date(file.lastModified))}</div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={isDownloading}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-vault-500 transition-all hover:bg-vault-900 hover:text-vault-300 disabled:opacity-50"
                        title="Download"
                      >
                        {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={isDeleting}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-vault-500 transition-all hover:bg-rose-accent/10 hover:text-rose-accent disabled:opacity-50"
                        title="Delete"
                      >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
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

