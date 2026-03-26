"use client";

import { Search, Server, HardDrive, FileText, Network, X, Command } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  type: "instance" | "bucket" | "file" | "vpc";
  detail: string;
  href: string;
}

interface SearchResults {
  instances: SearchResult[];
  buckets: SearchResult[];
  files: SearchResult[];
  vpcs: SearchResult[];
}

const typeIcons = {
  instance: Server,
  bucket: HardDrive,
  file: FileText,
  vpc: Network,
};

const typeLabels = {
  instance: "Compute Instances",
  bucket: "Storage Buckets",
  file: "Files",
  vpc: "Networks",
};

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || null);
      setSelectedIndex(0);
    } catch {
      console.error("Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  const allResults: SearchResult[] = results
    ? [...results.instances, ...results.buckets, ...results.files, ...results.vpcs]
    : [];

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      handleSelect(allResults[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-vault-100/20 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-vault-800/60 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-vault-800/40 px-4">
          <Search className="h-4 w-4 shrink-0 text-vault-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search instances, buckets, files, VPCs..."
            className="h-12 flex-1 bg-transparent text-sm text-vault-100 outline-none placeholder:text-vault-600"
          />
          <kbd className="hidden items-center gap-0.5 rounded-md border border-vault-800 bg-vault-950 px-1.5 py-0.5 text-[10px] font-medium text-vault-500 sm:flex">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-vault-700 border-t-cyan-accent" />
            </div>
          ) : query.length < 2 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-vault-500">Type at least 2 characters to search</p>
              <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-vault-600">
                <Command className="h-3 w-3" /> <span>+</span> <span>K</span>
                <span className="ml-1">to open anytime</span>
              </p>
            </div>
          ) : allResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-vault-500">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="py-2">
              {(["instances", "buckets", "files", "vpcs"] as const).map((group) => {
                const items = results?.[group] || [];
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-vault-500">
                      {typeLabels[items[0].type]}
                    </p>
                    {items.map((item) => {
                      const globalIndex = allResults.indexOf(item);
                      const Icon = typeIcons[item.type];
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                            globalIndex === selectedIndex
                              ? "bg-cyan-accent/6 text-vault-100"
                              : "text-vault-400 hover:bg-vault-950"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-vault-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            <p className="truncate text-[11px] text-vault-500">{item.detail}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchButton() {
  const [, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <button
      onClick={() => {
        const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true });
        document.dispatchEvent(event);
      }}
      className="flex items-center gap-2 rounded-lg border border-vault-800/60 bg-vault-950 px-3 py-1.5 text-xs text-vault-500 transition-colors hover:border-vault-700 hover:text-vault-400"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden rounded border border-vault-800 bg-white px-1 py-0.5 text-[10px] font-medium sm:inline">
        Ctrl K
      </kbd>
    </button>
  );
}
