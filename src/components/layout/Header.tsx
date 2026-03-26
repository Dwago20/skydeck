"use client";

import { NotificationDropdown } from "./NotificationDropdown";
import { SearchModal, SearchButton } from "./SearchModal";
import { ProfileDropdown } from "./ProfileDropdown";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <>
      <SearchModal />
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-vault-800/40 bg-white/70 px-6 backdrop-blur-xl">
        <div className="animate-slide-in">
          <h2 className="text-[15px] font-semibold tracking-tight text-vault-100">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-vault-500">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SearchButton />
          <NotificationDropdown />
          <ProfileDropdown />
        </div>
      </header>
    </>
  );
}
