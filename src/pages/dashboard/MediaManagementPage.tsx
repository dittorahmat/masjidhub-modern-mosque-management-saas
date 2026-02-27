import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ImageIcon, 
  Upload, 
  Share2, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck,
  LayoutGrid,
  FileBarChart,
  Download,
  Info,
  Loader2
} from 'lucide-react';
import type { MediaItem } from '@shared/types';

export default function MediaManagementPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('gallery');

  const { data: mediaItems = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['media-library', slug],
    queryFn: () => api<MediaItem[]>(`/api/${slug}/media`)
  });

  const { data: cloudinaryConfig } = useQuery({
    queryKey: ['cloudinary-config'],
    queryFn: () => api<{ cloudName: string, uploadPreset: string }>('/api/config/cloudinary')
  });

  const { data: reportCard } = useQuery({
    queryKey: ['finance-report-card', slug],
    queryFn: () => api<{ imageUrl: string, balance: number }>(`/api/${slug}/finance/report-card`)
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!cloudinaryConfig) throw new Error('Cloudinary not configured');

      // 1. Upload to Cloudinary (Unsigned)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      const cloudinaryData = await cloudinaryRes.json();
      if (!cloudinaryRes.ok) throw new Error(cloudinaryData.error?.message || 'Cloudinary upload failed');

      // 2. Save URL to Mosque Database
      return api(`/api/${slug}/blog`, { // Using blog/media shared endpoint logic
        method: 'POST',
        body: JSON.stringify({
          cloudinaryUrl: cloudinaryData.secure_url,
          fileName: file.name,
          fileType: file.type,
          eventTag: 'umum'
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library', slug] });
      toast.success('Media berhasil diunggah dan dioptimalkan');
    },
    onError: (error: any) => toast.error(`Gagal unggah: ${error.message}`)
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-2xl text-amber-700">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Media & Transparansi</h1>
            <p className="text-xs text-stone-500 text-muted-foreground uppercase tracking-widest font-medium">Digital Asset Management</p>
          </div>
        </div>
        <div className="relative">
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            onChange={handleFileUpload}
            disabled={uploadMutation.isPending}
          />
          <Button disabled={uploadMutation.isPending} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 h-11 px-6">
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadMutation.isPending ? 'Mengunggah...' : 'Unggah Media'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="gallery" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-stone-100/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="gallery" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LayoutGrid className="h-4 w-4" /> Galeri Foto
          </TabsTrigger>
          <TabsTrigger value="transparency" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileBarChart className="h-4 w-4" /> Infografis Laporan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mediaLoading ? (
              <div className="col-span-full py-20 text-center text-stone-400">Memuat galeri...</div>
            ) : mediaItems.length === 0 ? (
              <Card className="col-span-full border-dashed border-2 border-stone-200 bg-stone-50/50 rounded-3xl py-20 flex flex-col items-center">
                <ImageIcon className="h-12 w-12 text-stone-200 mb-4" />
                <p className="text-stone-400 font-medium">Galeri masih kosong</p>
                <p className="text-xs text-stone-400 mt-1">Unggah dokumentasi kegiatan pertama masjid Anda.</p>
              </Card>
            ) : (
              mediaItems.map((item) => (
                <div key={item.id} className="group relative bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="aspect-square bg-stone-100 overflow-hidden flex items-center justify-center">
                    {item.cloudinaryUrl ? (
                      <img src={item.cloudinaryUrl} alt={item.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-stone-200" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-stone-800 truncate mb-1">{item.fileName}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[8px] h-4 bg-emerald-50 text-emerald-700 border-emerald-100">
                        {item.eventTag || 'Unsorted'}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-stone-400 hover:text-rose-600"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge className="bg-white/90 backdrop-blur-sm text-emerald-700 border-none shadow-sm text-[8px] h-5 gap-1">
                      <ShieldCheck className="h-2.5 w-2.5" /> Auto-Opt
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="transparency" className="mt-0">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-emerald-50/50 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-800">
                  <FileBarChart className="h-4 w-4" /> Preview Laporan Instan
                </CardTitle>
                <CardDescription className="text-xs">
                  Ubah data saldo kas menjadi gambar estetik untuk dibagikan.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 flex flex-col items-center space-y-6">
                <div className="w-full max-w-sm aspect-[4/5] bg-stone-100 rounded-2xl shadow-inner border overflow-hidden relative flex items-center justify-center">
                  {reportCard ? (
                    <img src={reportCard.imageUrl} alt="Finance Report" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-8">
                      <FileBarChart className="h-12 w-12 text-stone-200 mx-auto mb-4" />
                      <p className="text-stone-400 text-xs italic font-medium uppercase tracking-widest leading-relaxed">
                        Menyiapkan Infografis...
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 w-full max-w-sm">
                  <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2 h-12">
                    <Share2 className="h-4 w-4" /> Share WhatsApp
                  </Button>
                  <Button variant="outline" className="rounded-xl gap-2 h-12 border-stone-200">
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-2xl border-stone-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">Tentang Laporan Sosial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-4">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-xs text-stone-600 leading-relaxed">
                      <span className="font-bold text-stone-800 block mb-1">Data Real-time</span>
                      Infografis dibuat otomatis berdasarkan saldo terakhir di modul Keuangan. Tidak perlu input manual lagi.
                    </div>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-4">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Share2 className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-xs text-stone-600 leading-relaxed">
                      <span className="font-bold text-stone-800 block mb-1">Format WhatsApp Story</span>
                      Ukuran gambar dioptimalkan untuk status WhatsApp dan Instagram agar tidak terpotong.
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4">
                <div className="bg-amber-100 p-2 rounded-full text-amber-700 mt-1">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 italic">Tips Transparansi</h4>
                  <p className="text-xs text-amber-800 leading-relaxed mt-1">
                    Bagikan laporan keuangan minimal sekali seminggu (misal: setiap hari Jumat) untuk membangun kepercayaan jamaah dan mendorong partisipasi donasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
