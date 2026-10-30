import React from "react";
import { Link, useParams } from "react-router-dom";
import { Menu, Bell } from "lucide-react";
import { useTenantName, useUserRole } from "@/lib/store";

interface MobileHeaderProps {
  onOpenMenu: () => void;
}

export function MobileHeader({ onOpenMenu }: MobileHeaderProps): JSX.Element {
  const { slug } = useParams();
  const tenantName = useTenantName();
  const userRole = useUserRole();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 border-b bg-background/95 backdrop-blur md:hidden pt-safe">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Buka menu navigasi"
          className="flex items-center justify-center h-10 w-10 -ml-1 rounded-xl text-stone-700 hover:bg-stone-100 active:bg-stone-200 transition-colors min-h-[44px] min-w-[44px]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          to={`/app/${slug}/dashboard`}
          className="flex items-center gap-2 truncate"
        >
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-primary/20 shrink-0">
            MH
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-black font-display tracking-tight text-stone-900 truncate">
              {tenantName || "MasjidHub"}
            </span>
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase truncate">
              {userRole?.replace("_", " ") || "Jamaah"}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Link
          to={`/app/${slug}/notifikasi`}
          aria-label="Lihat pengumuman & notifikasi"
          className="flex items-center justify-center h-10 w-10 rounded-xl text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors min-h-[44px] min-w-[44px]"
        >
          <Bell className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
