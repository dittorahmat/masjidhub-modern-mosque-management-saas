import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tenant } from '@shared/types';

interface QrCodeData {
  slug: string;
  name: string;
  qrData: string;
  url: string;
}

export default function QrCodePage() {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);
  
  const { data: qrData, isLoading, isError } = useQuery({
    queryKey: ['qr-code', slug],
    queryFn: () => api<QrCodeData>(`/api/${slug}/qr-code`)
  });

  const handleCopy = () => {
    if (qrData?.url) {
      navigator.clipboard.writeText(qrData.url);
      setCopied(true);
      toast.success('URL berhasil disalin');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (qrData?.url && navigator.share) {
      try {
        await navigator.share({
          title: `Portal Masjid ${qrData.name}`,
          url: qrData.url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else if (qrData?.url) {
      handleCopy(); // Fallback to copy if web share isn't supported
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-display font-bold">QR Code Akses Masjid</h1>
          <p className="text-muted-foreground">Bagikan akses portal masjid Anda dengan mudah.</p>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {isError && (
          <div className="text-center py-12">
            <p className="text-destructive">Terjadi kesalahan saat mengambil data QR Code</p>
          </div>
        )}

        {qrData && (
          <div className="flex flex-col items-center">
            <Card className="illustrative-card w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <QrCode className="h-6 w-6" />
                  Portal Masjid {qrData.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                {/* Placeholder for QR Code - in a real implementation, you would use a QR code library */}
                <div className="mx-auto w-48 h-48 bg-stone-100 rounded-xl flex items-center justify-center border-2 border-dashed border-stone-300">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto text-stone-400" />
                    <p className="text-xs text-stone-500 mt-2">QR Code</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Pindai QR Code ini untuk mengakses portal masjid Anda
                  </p>
                  
                  <div className="p-4 bg-stone-50 rounded-lg break-all">
                    <p className="text-sm font-mono">{qrData.url}</p>
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Disalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Salin URL
                        </>
                      )}
                    </Button>
                    
                    {navigator.share && (
                      <Button variant="outline" onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Bagikan
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="illustrative-card w-full max-w-md mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Panduan Penggunaan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5">1</Badge>
                  <div>
                    <p className="font-medium">Bagikan QR Code</p>
                    <p className="text-sm text-muted-foreground">Cetak atau tampilkan QR Code di tempat strategis di masjid</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5">2</Badge>
                  <div>
                    <p className="font-medium">Pindai oleh Jamaah</p>
                    <p className="text-sm text-muted-foreground">Jamaah bisa memindai dengan kamera ponsel atau aplikasi QR scanner</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5">3</Badge>
                  <div>
                    <p className="font-medium">Akses Portal</p>
                    <p className="text-sm text-muted-foreground">Akan langsung terarah ke portal masjid Anda</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}