"use client";

import { Upload, Cloud, CheckCircle, AlertCircle, Loader2, CloudUpload } from "lucide-react";
import { useState, useRef } from "react";
import { cn, formatBytes } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null, provider: "aws" | "azure") => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setResult(null);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", provider === "aws" ? "project-data-lake" : "platform-docs");

      const endpoint = provider === "aws" ? "/api/storage/aws" : "/api/storage/azure";
      const res = await fetch(endpoint, { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setResult({
        success: true,
        message: `${file.name} (${formatBytes(file.size)}) uploaded successfully${data.source === "database" ? " (demo mode)" : ""}`,
      });
      onUploadComplete?.();
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "glass-card relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-500",
          dragOver
            ? "border-cyan-accent/40 bg-cyan-accent/[0.04] shadow-[0_0_40px_rgba(14,165,233,0.06)]"
            : "border-vault-700/40 hover:border-vault-600/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files, "aws"); }}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleUpload(e.target.files, "aws")} />

        <div className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500",
          dragOver
            ? "bg-cyan-accent/10 ring-2 ring-cyan-accent/20"
            : "bg-vault-900 ring-1 ring-vault-800"
        )}>
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-cyan-accent" />
          ) : dragOver ? (
            <CloudUpload className="h-8 w-8 text-cyan-accent" />
          ) : (
            <Upload className="h-8 w-8 text-vault-500" />
          )}
        </div>
        <p className="mt-5 text-sm font-semibold text-vault-300">
          {uploading ? "Uploading to cloud..." : "Drop files here to upload"}
        </p>
        <p className="mt-1.5 text-xs text-vault-500">
          or click a button below &middot; supports any file type
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="glass-card-hover flex items-center gap-2 rounded-xl bg-cyan-accent/8 px-5 py-2.5 text-xs font-semibold text-cyan-accent ring-1 ring-cyan-accent/15 transition-all hover:bg-cyan-accent/15 disabled:opacity-50"
          >
            <Cloud className="h-3.5 w-3.5" />
            Upload to AWS S3
          </button>
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.onchange = (e) => handleUpload((e.target as HTMLInputElement).files, "azure");
              input.click();
            }}
            disabled={uploading}
            className="glass-card-hover flex items-center gap-2 rounded-xl bg-azure-blue/8 px-5 py-2.5 text-xs font-semibold text-azure-blue ring-1 ring-azure-blue/15 transition-all hover:bg-azure-blue/15 disabled:opacity-50"
          >
            <Cloud className="h-3.5 w-3.5" />
            Upload to Azure Blob
          </button>
        </div>
      </div>

      {result && (
        <div
          className={cn(
            "animate-fade-in flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm ring-1",
            result.success
              ? "bg-emerald-accent/5 text-emerald-accent ring-emerald-accent/15"
              : "bg-rose-accent/5 text-rose-accent ring-rose-accent/15"
          )}
        >
          {result.success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {result.message}
        </div>
      )}
    </div>
  );
}
