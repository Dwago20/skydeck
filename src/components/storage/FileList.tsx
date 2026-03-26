"use client";

import { File, FileText, Image, Download, Trash2 } from "lucide-react";
import { formatBytes, timeAgo } from "@/lib/utils";
import { providerColors, providerLabels } from "@/lib/constants";
import type { StorageFile } from "@/lib/types";

interface FileListProps {
  files: StorageFile[];
}

function fileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return Image;
  if (contentType === "application/pdf") return FileText;
  return File;
}

export function FileList({ files }: FileListProps) {
  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="border-b border-vault-800/40 px-5 py-4">
        <h3 className="text-sm font-bold text-vault-200">Recent Files</h3>
        <p className="mt-0.5 text-[11px] text-vault-500">{files.length} files across providers</p>
      </div>

      <div className="divide-y divide-vault-800/30">
        {files.map((file) => {
          const Icon = fileIcon(file.contentType);
          const fileName = file.key.split("/").pop() || file.key;
          const filePath = file.key.split("/").slice(0, -1).join("/");

          return (
            <div
              key={`${file.bucket}-${file.key}`}
              className="group flex items-center gap-4 px-5 py-3 transition-all duration-300 hover:bg-vault-900/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-vault-900 ring-1 ring-vault-800/50 transition-all duration-300 group-hover:scale-105">
                <Icon className="h-4 w-4 text-vault-500" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-vault-300 transition-colors group-hover:text-vault-100">
                  {fileName}
                </p>
                <p className="truncate text-[11px] text-vault-500">
                  {filePath} &middot; {file.bucket}
                </p>
              </div>

              <div
                className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: `${providerColors[file.provider]}12`,
                  color: providerColors[file.provider],
                }}
              >
                {providerLabels[file.provider]}
              </div>

              <div className="w-20 shrink-0 text-right text-xs font-medium text-vault-500">
                {formatBytes(file.sizeBytes)}
              </div>

              <div className="w-16 shrink-0 text-right text-[11px] text-vault-600">
                {timeAgo(file.lastModified)}
              </div>

              <div className="flex shrink-0 gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-vault-500 transition-all hover:bg-vault-900 hover:text-vault-300">
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-vault-500 transition-all hover:bg-rose-accent/10 hover:text-rose-accent">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
