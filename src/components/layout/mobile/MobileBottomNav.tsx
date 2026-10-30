import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  HeartPulse,
  Calendar,
  Users,
  Send,
  BookOpen,
  MessageSquare,
  Menu,
  LucideIcon,
} from "lucide-react";
import { useUserRole } from "@/lib/store";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

interface NavTab {
  name: string;
  icon: LucideIcon;
  href: string;
  matchPrefix?: string;
  matchQueryTab?: string;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps): JSX.Element {
  const { slug } = useParams();
  const location = useLocation();
  const userRole = useUserRole();

  const getRoleTabs = (): NavTab[] => {
    if (userRole === "amil_zakat") {
      return [
        {
          name: "Dashboard",
          icon: LayoutDashboard,
          href: `/app/${slug}/dashboard`,
        },
        {
          name: "ZIS",
          icon: HeartPulse,
          href: `/app/${slug}/zis`,
        },
        {
          name: "Mustahik",
          icon: Users,
          href: `/app/${slug}/zis?tab=mustahik`,
          matchPrefix: `/app/${slug}/zis`,
          matchQueryTab: "mustahik",
        },
        {
          name: "Distribusi",
          icon: Send,
          href: `/app/${slug}/zis?tab=distribution`,
          matchPrefix: `/app/${slug}/zis`,
          matchQueryTab: "distribution",
        },
      ];
    }

    if (userRole === "ustadz" || userRole === "jamaah") {
      return [
        {
          name: "Jadwal",
          icon: Calendar,
          href: `/app/${slug}/jadwal-sholat`,
        },
        {
          name: "Kajian",
          icon: BookOpen,
          href: `/app/${slug}/kajian-videos`,
        },
        {
          name: "Kegiatan",
          icon: Calendar,
          href: `/app/${slug}/events`,
        },
        {
          name: "Forum",
          icon: MessageSquare,
          href: `/app/${slug}/forum`,
        },
      ];
    }

    // Default / DKM Admin / Superadmin
    return [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        href: `/app/${slug}/dashboard`,
      },
      {
        name: "Kas",
        icon: Wallet,
        href: `/app/${slug}/finance`,
      },
      {
        name: "ZIS",
        icon: HeartPulse,
        href: `/app/${slug}/zis`,
      },
      {
        name: "Kegiatan",
        icon: Calendar,
        href: `/app/${slug}/events`,
      },
    ];
  };

  const tabs = getRoleTabs();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentQueryTab = searchParams.get("tab");

  const isTabActive = (tab: NavTab): boolean => {
    if (tab.matchQueryTab) {
      return (
        currentPath.startsWith(tab.matchPrefix || tab.href.split("?")[0]) &&
        currentQueryTab === tab.matchQueryTab
      );
    }

    // If current page has a tab param, a general tab href without tab query shouldn't match if another specialized tab matches
    const basePath = tab.href.split("?")[0];
    if (currentQueryTab && basePath === currentPath) {
      return false;
    }

    return currentPath === basePath || currentPath.startsWith(`${basePath}/`);
  };

  return (
    <nav
      aria-label="Navigasi bawah mobile"
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-stone-200/80 md:hidden pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const active = isTabActive(tab);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name + tab.href}
              to={tab.href}
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] h-full py-1 text-xs font-semibold transition-colors rounded-xl mx-0.5",
                active
                  ? "text-primary font-bold"
                  : "text-stone-500 hover:text-stone-800 active:text-stone-900"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                  active ? "bg-primary/10 text-primary" : "text-stone-500"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] leading-tight truncate max-w-full px-0.5 mt-0.5">
                {tab.name}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] h-full py-1 text-xs font-semibold text-stone-500 hover:text-stone-800 active:text-stone-900 transition-colors rounded-xl mx-0.5"
          aria-label="Buka menu lengkap lainnya"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full text-stone-500">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[11px] leading-tight truncate max-w-full px-0.5 mt-0.5">
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  );
}
