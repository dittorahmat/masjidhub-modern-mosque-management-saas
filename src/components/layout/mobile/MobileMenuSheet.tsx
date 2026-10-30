import React from "react";
import { Link, useParams } from "react-router-dom";
import { X, Settings, LogOut, ShieldCheck, LayoutDashboard } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { useAppStore, useUserRole, useUserName, useTenantName } from "@/lib/store";
import { getAppNavigation } from "@/lib/navigation";

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps): JSX.Element {
  const { slug } = useParams();
  const tenantName = useTenantName();
  const userRole = useUserRole();
  const userName = useUserName();
  const actions = useAppStore((s) => s.actions);
  const logout = actions.logout;

  const isSuper = userRole === "superadmin_platform";
  const navigation = getAppNavigation(slug, userRole);

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85vw] max-w-sm p-0 flex flex-col justify-between h-full bg-stone-50/95 backdrop-blur-xl">
        <div className="flex flex-col flex-1 overflow-hidden">
          <SheetHeader className="p-4 border-b border-stone-200/50 flex flex-row items-center justify-between space-y-0 text-left">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <SheetTitle className="text-sm font-black font-display truncate w-40 tracking-tight italic">
                  {tenantName || "MasjidHub"}
                </SheetTitle>
                <SheetDescription className="text-[10px] font-black text-primary/70 uppercase tracking-widest">
                  {userRole?.replace("_", " ") || "Guest"}
                </SheetDescription>
              </div>
            </div>
            <SheetClose className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-200/60 transition-colors">
              <X className="h-5 w-5" />
              <span className="sr-only">Tutup</span>
            </SheetClose>
          </SheetHeader>

          {isSuper && (
            <div className="px-3 pt-3">
              <Link
                to="/super-admin/dashboard"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase tracking-wider hover:bg-red-100 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Platform Admin</span>
              </Link>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {navigation
              .filter((item) => item.show)
              .map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-700 hover:text-stone-950 hover:bg-white border border-transparent hover:border-stone-200/60 font-semibold text-sm transition-all min-h-[44px]"
                >
                  <item.icon className="h-4 w-4 text-stone-400" />
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
          </div>
        </div>

        <div className="p-4 border-t border-stone-200/60 bg-stone-100/50 pb-safe">
          <div className="mb-3 px-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">
              Masuk sebagai
            </p>
            <p className="text-xs font-bold text-stone-800 truncate">
              {userName || "Anonim"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/app/${slug}/settings`}
              onClick={handleLinkClick}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-stone-200/60 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs min-h-[44px] transition-colors"
            >
              <Settings className="h-4 w-4 text-stone-500" />
              <span>Pengaturan</span>
            </Link>
            <button
              onClick={() => {
                handleLinkClick();
                logout();
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-red-200/60 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs min-h-[44px] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
