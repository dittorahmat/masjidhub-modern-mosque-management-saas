import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useUserRole } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { QrCode, Download, Settings, Loader2, RefreshCw } from 'lucide-react';
import type { Tenant } from '@shared/types';
import { QrisCard } from '@/components/qris/QrisCard';
import { QrisUpdateDialog } from '@/components/qris/QrisUpdateDialog';
import { DonationInfoPanel } from '@/components/qris/DonationInfoPanel';

export default function QrisDonationPage() {
  const { slug } = useParams<{ slug: string }>();
  const userRole = useUserRole();
  const queryClient = useQueryClient();

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Check admin rights
  const isSuper = userRole === 'superadmin_platform';
  const isAdmin = userRole === 'dkm_admin' || isSuper;

  // Fetch tenant info
  const { data: tenant, isLoading, refetch } = useQuery({
    queryKey: ['tenants', slug],
    queryFn: () => api<Tenant>(`/api/tenants/${slug}`),
  });

  const qrisUrl = tenant?.qrisImageUrl || '/qris-masjid.jpeg';

  // Mutation for updating QRIS image URL
  const updateTenantMutation = useMutation({
    mutationFn: (updatedData: Partial<Tenant>) =>
      api<Tenant>(`/api/${slug}/settings`, {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['tenants', slug], data);
      queryClient.invalidateQueries({ queryKey: ['tenants', slug] });
      toast.success('Gambar QRIS berhasil diperbarui!');
      setIsUpdateDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui QRIS');
    },
  });

  // Handle Download QRIS
  const handleDownloadQris = async () => {
    try {
      const response = await fetch(qrisUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qris-${tenant?.slug || 'masjid'}.jpeg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('QRIS berhasil diunduh');
    } catch {
      window.open(qrisUrl, '_blank');
      toast.info('QRIS dibuka di tab baru');
    }
  };

  const handleSaveQris = (newUrl: string) => {
    updateTenantMutation.mutate({ qrisImageUrl: newUrl });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Memuat data QRIS donasi masjid...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <QrCode className="h-5 w-5" />
            </span>
            <h1 className="text-2xl md:text-3xl font-display font-black text-stone-900 tracking-tight">
              Donasi & Infaq QRIS
            </h1>
          </div>
          <p className="text-sm text-stone-500">
            Pusat barcode QRIS resmi dan rekening donasi masjid {tenant?.name || 'Masjid'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(true)}
              className="rounded-xl border-stone-200 gap-2 hover:bg-stone-50"
            >
              <Settings className="h-4 w-4 text-stone-600" />
              <span>Pengaturan QRIS</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl h-10 w-10 p-0 hover:bg-stone-50"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4 text-stone-600" />
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadQris}
            className="rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Unduh QRIS</span>
          </Button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: National Standard QRIS Display Card */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <QrisCard
            tenant={tenant}
            qrisUrl={qrisUrl}
            onDownload={handleDownloadQris}
          />
        </div>

        {/* Right Side: Quick Amount Recommendations, Bank Accounts, and ZIS shortcut */}
        <div className="lg:col-span-6">
          <DonationInfoPanel
            tenant={tenant}
            slug={slug}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* Admin QRIS Update Dialog */}
      {isAdmin && (
        <QrisUpdateDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          onSave={handleSaveQris}
          isPending={updateTenantMutation.isPending}
        />
      )}
    </div>
  );
}
