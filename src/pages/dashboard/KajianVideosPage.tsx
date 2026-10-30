import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useUserRole } from '@/lib/store';
import type { KajianVideo } from '@shared/types';
import { 
  Plus, 
  Search, 
  Video, 
  Sparkles,
  Youtube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getYoutubeEmbedUrl } from '@shared/youtube';
import { KajianVideoCard } from '@/components/kajian/KajianVideoCard';
import { AddKajianDialog, KAJIAN_CATEGORIES } from '@/components/kajian/AddKajianDialog';

export default function KajianVideosPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const userRole = useUserRole();

  const canManage = userRole === 'dkm_admin' || userRole === 'ustadz' || userRole === 'superadmin_platform';

  // Filters & Modal State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeVideo, setActiveVideo] = useState<KajianVideo | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Fetch Kajian Videos
  const { data: videos = [], isLoading } = useQuery<KajianVideo[]>({
    queryKey: ['kajian-videos', slug],
    queryFn: async () => {
      return await api<KajianVideo[]>(`/api/${slug}/kajian-videos`);
    },
    enabled: !!slug,
  });

  // Mutation: Create
  const createMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      ustadzName: string;
      youtubeUrl: string;
      youtubeVideoId: string;
      duration: string;
      category: string;
      description: string;
    }) => {
      return await api(`/api/${slug}/kajian-videos`, { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kajian-videos', slug] });
      toast.success('Rekaman kajian berhasil ditambahkan!');
      setIsAddOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menambahkan video kajian');
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api(`/api/${slug}/kajian-videos/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kajian-videos', slug] });
      toast.success('Rekaman kajian berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus video kajian');
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Hapus video kajian "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Filter Data
  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.ustadzName && v.ustadzName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || v.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <Youtube className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Media & Dakwah
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-stone-900 tracking-tight">
            Rekaman Video Kajian
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Kumpulan arsip ceramah dan kajian ilmiah masjid terintegrasi langsung dengan YouTube.
          </p>
        </div>

        {canManage && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="shadow-sm font-semibold rounded-xl bg-primary hover:bg-primary/95 text-white gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Video Kajian
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-stone-200/80 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Cari judul kajian, nama ustadz, atau materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-transparent border-0 focus-visible:ring-0 text-sm placeholder:text-stone-400 h-9"
          />
        </div>
        <div className="w-full sm:w-56 shrink-0">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 text-xs rounded-xl border-stone-200 bg-stone-50/50">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              {KAJIAN_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-video bg-stone-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <KajianVideoCard
              key={video.id}
              video={video}
              canManage={canManage}
              onPlay={setActiveVideo}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300 space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 opacity-60" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-bold text-stone-800 text-base">Belum Ada Rekaman Kajian</h3>
            <p className="text-xs text-stone-500">
              {searchQuery || selectedCategory !== 'all'
                ? 'Tidak ada kajian yang cocok dengan kriteria pencarian Anda.'
                : 'Mulai arsipkan video ceramah dan kajian masjid dengan menempelkan URL YouTube.'}
            </p>
          </div>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="gap-2 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Rekaman Sekarang
            </Button>
          )}
        </div>
      )}

      {/* Video Player Embed Modal */}
      <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-stone-950 border-stone-800 text-white rounded-2xl">
          <DialogHeader className="p-4 sm:p-6 pb-2 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-rose-600/80 text-white font-medium">
                {activeVideo?.category?.replace('_', ' ').toUpperCase()}
              </span>
              {activeVideo?.ustadzName && (
                <span className="text-xs text-stone-400 font-medium">
                  {activeVideo.ustadzName}
                </span>
              )}
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold line-clamp-2 text-white">
              {activeVideo?.title}
            </DialogTitle>
          </DialogHeader>

          {/* YouTube Embed Player */}
          {activeVideo && (
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={getYoutubeEmbedUrl(activeVideo.youtubeVideoId, true)}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {activeVideo?.description && (
            <div className="p-4 sm:p-6 pt-3 bg-stone-900 border-t border-stone-800 text-xs text-stone-300 leading-relaxed max-h-40 overflow-y-auto">
              <p className="font-semibold text-stone-400 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Ringkasan Kajian:
              </p>
              <p className="whitespace-pre-line">{activeVideo.description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Kajian Dialog */}
      <AddKajianDialog
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={(payload) => createMutation.mutate(payload)}
        isPending={createMutation.isPending}
      />
    </div>
  );
}
