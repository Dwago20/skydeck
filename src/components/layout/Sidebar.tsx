"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HardDrive,
  Server,
  Network,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarStatus } from "./SidebarStatus";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/storage", label: "Storage", icon: HardDrive },
  { href: "/compute", label: "Compute", icon: Server },
  { href: "/network", label: "Network", icon: Network },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-vault-800/60 bg-white/70 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
      style={{ boxShadow: "1px 0 24px rgba(0,0,0,0.03)" }}
    >
       {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-vault-800/40 px-5">
        <img src="/logo.png" alt="SkyDeck" className="h-14 w-14 shrink-0 rounded-xl object-contain" />
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-[16px] font-bold tracking-tight text-vault-100">
              SkyDeck
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-vault-500">
              Cloud Portal
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-cyan-accent/8 text-cyan-accent"
                  : "text-vault-400 hover:bg-vault-900/80 hover:text-vault-200"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-cyan-accent" />
              )}

              <div className="relative z-10 flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-all duration-300",
                    isActive && "drop-shadow-[0_0_6px_rgba(14,165,233,0.3)]"
                  )}
                />
                {!collapsed && <span>{label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <SidebarStatus collapsed={collapsed} />

      {/* Collapse */}
      <div className="border-t border-vault-800/40 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-xl py-2 text-vault-500 transition-all duration-300 hover:bg-vault-900/80 hover:text-vault-300"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
