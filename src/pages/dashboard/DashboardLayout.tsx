import React, { useEffect } from 'react';
import { useParams, Navigate, Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
export function DashboardLayout() {
  const { slug } = useParams();
  const user = useAppStore(s => s.user);
  const currentTenant = useAppStore(s => s.currentTenant);
  const setCurrentTenant = useAppStore(s => s.setCurrentTenant);
  useEffect(() => {
    async function loadTenant() {
      if (!slug) return;
      try {
        const tenant = await api<any>(`/api/tenants/${slug}`);
        setCurrentTenant(tenant);
      } catch (err) {
        console.error("Failed to load tenant", err);
      }
    }
    loadTenant();
  }, [slug, setCurrentTenant]);
  // For Phase 1 demo, if no user, we simulate a login or redirect
  // Real apps would check auth tokens here
  if (!user && slug !== 'al-hikmah') { 
    // Usually redirect to /login
  }
  if (!currentTenant && slug) {
    return (
      <div className="h-screen flex items-center justify-center p-8 space-y-4 flex-col">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full max-w-4xl" />
      </div>
    );
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="h-16 border-b flex items-center px-4 justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-[1px] bg-border" />
            <h2 className="font-display font-bold text-lg">{currentTenant?.name}</h2>
          </div>
        </header>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}