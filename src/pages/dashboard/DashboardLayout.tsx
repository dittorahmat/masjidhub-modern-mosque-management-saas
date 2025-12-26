import React, { useEffect } from 'react';
import { useParams, Navigate, Outlet, Link } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAppStore, useTenantStatus, useTenantName, useUserId } from '@/lib/store';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';
import type { Tenant } from '@shared/types';
export function DashboardLayout() {
  const { slug } = useParams();
  const userId = useUserId();
  const tenantStatus = useTenantStatus();
  const tenantName = useTenantName();
  const actions = useAppStore(s => s.actions);
  const setCurrentTenant = actions.setCurrentTenant;
  useEffect(() => {
    async function loadTenant() {
      if (!slug) return;
      try {
        const tenant = await api<Tenant>(`/api/tenants/${slug}`);
        setCurrentTenant(tenant);
      } catch (err) {
        console.error(`Failed to load tenant ${slug}`, err);
      }
    }
    loadTenant();
  }, [slug, setCurrentTenant]);
  // Auth Guard: In real app, we check if userId exists. 
  // For demo, we allow access to 'al-hikmah' without a user to showcase the platform.
  if (!userId && slug !== 'al-hikmah') {
    return <Navigate to="/login" replace />;
  }
  if (tenantStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6 illustrative-card p-10">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <Clock className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-display font-bold">Menunggu Persetujuan</h1>
          <p className="text-muted-foreground">
            Masjid <span className="font-bold text-foreground">{tenantName}</span> sedang dalam proses verifikasi oleh Platform Admin. Mohon tunggu 1-2 hari kerja.
          </p>
          <div className="pt-4">
            <Link to="/" className="text-primary font-bold hover:underline">Kembali ke Beranda</Link>
          </div>
        </div>
      </div>
    );
  }
  if (!tenantName && slug) {
    return (
      <div className="h-screen flex items-center justify-center p-8 space-y-4 flex-col">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full max-w-4xl" />
        <p className="text-sm text-muted-foreground animate-pulse">Menghubungkan ke Portal Masjid...</p>
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
            <h2 className="font-display font-bold text-lg">{tenantName}</h2>
          </div>
        </header>
        <main className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}