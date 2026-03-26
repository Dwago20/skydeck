"use client";

import { LogOut, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function ProfileDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useApi<{ user: AuthUser | null }>("/api/auth/me");

  const user = data?.user;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-vault-200 text-xs font-semibold text-white transition-colors hover:bg-vault-300"
      >
        {initials || <User className="h-4 w-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-vault-800/60 bg-white/90 shadow-lg backdrop-blur-xl">
          <div className="border-b border-vault-800/40 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-vault-200 text-sm font-semibold text-white">
                {initials || <User className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-vault-200">
                  {user?.name || "Loading..."}
                </p>
                <p className="truncate text-[11px] text-vault-500">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>
          <div className="py-1">
            <button
              onClick={handleSignOut}
              disabled={loggingOut}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-vault-400 transition-colors hover:bg-vault-950 hover:text-rose-accent disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
