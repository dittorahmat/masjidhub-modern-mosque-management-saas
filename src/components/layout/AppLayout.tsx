/*
Wraps children in a sidebar layout. Don't use this if you don't need a sidebar
*/
import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileHeader } from "@/components/layout/mobile/MobileHeader";
import { MobileBottomNav } from "@/components/layout/mobile/MobileBottomNav";
import { MobileMenuSheet } from "@/components/layout/mobile/MobileMenuSheet";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};

export function AppLayout({
  children,
  container = false,
  className,
  contentClassName,
}: AppLayoutProps): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className={cn("min-h-screen flex flex-col pb-16 md:pb-0", className)}>
        {/* Mobile Header (< 768px) */}
        <MobileHeader onOpenMenu={() => setMobileMenuOpen(true)} />

        {/* Desktop Sidebar Toggle (hidden on mobile to prevent collision with mobile header) */}
        <div className="hidden md:block absolute left-2 top-2 z-20">
          <SidebarTrigger />
        </div>

        {/* Main Content Area */}
        <main className="flex-1">
          {container ? (
            <div
              className={
                "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-10 lg:py-12" +
                (contentClassName ? ` ${contentClassName}` : "")
              }
            >
              {children}
            </div>
          ) : (
            children
          )}
        </main>

        {/* Mobile Role-Aware Bottom Navigation (< 768px) */}
        <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />

        {/* Mobile Menu Drawer / Off-Canvas Sheet */}
        <MobileMenuSheet
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
