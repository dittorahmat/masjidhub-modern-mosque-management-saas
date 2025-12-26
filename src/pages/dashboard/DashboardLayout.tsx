import React, { useEffect } from 'react';
import { useParams, Navigate, Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useUser, useCurrentTenant, useAppActions } from '@/lib/store';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Clock } from 'lucide-react';
import type { Tenant } from '@shared/types';
export function DashboardLayout() {
  const { slug } = useParams();
  const user = useUser();
  const currentTenant = useCurrentTenant();
  const { setCurrentTenant } = useAppActions();
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
  if (!user && slug !== 'al-hikmah') {
    return <Navigate to="/login" replace />;
  }
  if (currentTenant?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6 illustrative-card p-10">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <Clock className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-display font-bold">Menunggu Persetujuan</h1>
          <p className="text-muted-foreground">
            Masjid <span className="font-bold text-foreground">{currentTenant.name}</span> sedang dalam proses verifikasi oleh Platform Admin. Mohon tunggu 1-2 hari kerja.
          </p>
          <div className="pt-4">
            <Navigate to="/" className="text-primary font-bold hover:underline">Kembali ke Beranda</Navigate>
          </div>
        </div>
      </div>
    );
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