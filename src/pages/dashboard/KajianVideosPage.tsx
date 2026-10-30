import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useUserRole } from '@/lib/store';
import type { KajianVideo } from '@shared/types';
import { 
  Play, 
  ExternalLink, 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  User, 
  Video, 
  Tag, 
  Sparkles,
  Youtube
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

const CATEGORIES = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'kajian_tematik', label: 'Kajian Tematik' },
  { value: 'tafsir', label: 'Tafsir Al-Qur\'an' },
  { value: 'fiqih', label: 'Fiqih & Muamalah' },
  { value: 'aqidah', label: 'Aqidah & Akhlak' },
  { value: 'sirah', label: 'Sirah Nabawiyah' },
  { value: 'tahsin', label: 'Tahsin & Tajwid' },
  { value: 'kajian_rutin', label: 'Kajian Rutin' },
];

export default function KajianVideosPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const userRole = useUserRole();

  const canManage = userRole === 'dkm_admin' || userRole === 'ustadz' || userRole === 'superadmin_platform';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeVideo, setActiveVideo] = useState<KajianVideo | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formUstadz, setFormUstadz] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formCategory, setFormCategory] = useState('kajian_tematik');
  const [formDescription, setFormDescription] = useState('');

  // Auto-extracted videoId & preview
  const extractedVideoId = extractYoutubeId(formUrl);
  const previewThumbnail = extractedVideoId 
    ? `https://img.youtube.com/vi/${extractedVideoId}/hqdefault.jpg` 
    : '';

  // Fetch Kajian Videos
  const { data: videos = [], isLoading } = useQuery<KajianVideo[]>({
    queryKey: ['kajian-videos', slug],
    queryFn: () => api<KajianVideo[]>(`/api/${slug}/kajian-videos`),
    enabled: !!slug,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newVideo: Partial<KajianVideo>) =>
      api(`/api/${slug}/kajian-videos`, {
        method: 'POST',
        body: JSON.stringify(newVideo),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kajian-videos', slug] });
      toast.success('Rekaman kajian berhasil ditambahkan!');
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal menambahkan video kajian');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/${slug}/kajian-videos/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kajian-videos', slug] });
      toast.success('Video kajian berhasil dihapus');
      if (activeVideo) setActiveVideo(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal menghapus video kajian');
    },
  });

  const resetForm = () => {
    setFormTitle('');
    setFormUstadz('');
    setFormUrl('');
    setFormDuration('');
    setFormCategory('kajian_tematik');
    setFormDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Judul kajian wajib diisi');
      return;
    }
    if (!formUrl.trim() || !extractedVideoId) {
      toast.error('URL YouTube tidak valid');
      return;
    }

    createMutation.mutate({
      title: formTitle.trim(),
      ustadzName: formUstadz.trim() || undefined,
      youtubeUrl: formUrl.trim(),
      youtubeVideoId: extractedVideoId,
      duration: formDuration.trim() || undefined,
      category: formCategory,
      description: formDescription.trim() || undefined,
      thumbnailUrl: previewThumbnail,
    });
  };

  // Filtered list
  const filteredVideos = videos.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ustadzName && item.ustadzName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const formatCategoryBadge = (cat?: string) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? found.label : (cat || 'Kajian');
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
              <Youtube className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-stone-900">
                Rekaman Kajian
              </h1>
              <p className="text-sm font-medium text-stone-500">
                Galeri arsip video ceramah & kajian ilmu YouTube masjid
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="rounded-full px-6 h-12 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white gap-2 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> Tambah Video Kajian
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-stone-200/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Cari judul kajian, nama ustadz, atau topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 bg-stone-50/50 border-stone-200 rounded-2xl text-sm font-medium focus:ring-primary focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-12 w-full md:w-[200px] bg-stone-50/50 border-stone-200 rounded-2xl text-sm font-semibold">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-stone-200">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="text-xs font-semibold">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="h-12 px-4 rounded-2xl font-bold text-xs bg-stone-100 text-stone-700 whitespace-nowrap">
            {filteredVideos.length} Video
          </Badge>
        </div>
      </div>

      {/* Video Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 rounded-3xl bg-stone-200/60 animate-pulse" />
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Video className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-display font-bold text-stone-800">
            Belum ada rekaman kajian
          </h3>
          <p className="text-stone-500 max-w-md mx-auto text-sm">
            {searchQuery || selectedCategory !== 'all'
              ? 'Tidak ada video yang cocok dengan filter pencarian Anda.'
              : 'Tambahkan rekaman video kajian dari YouTube untuk dapat diakses oleh jamaah.'}
          </p>
          {canManage && (
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(true)}
              className="rounded-full mt-2 font-bold"
            >
              Tambah Video Sekarang
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const videoThumbnail =
              video.thumbnailUrl ||
              `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;

            return (
              <Card
                key={video.id}
                className="group overflow-hidden rounded-3xl border-stone-200/70 hover:shadow-xl transition-all duration-300 flex flex-col bg-white"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
                  <img
                    src={videoThumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{video.duration}</span>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 backdrop-blur-md text-stone-900 border-none font-bold text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                      {formatCategoryBadge(video.category)}
                    </Badge>
                  </div>

                  {/* Play Button Overlay */}
                  <button
                    onClick={() => setActiveVideo(video)}
                    aria-label={`Tonton ${video.title}`}
                    className="absolute inset-0 flex items-center justify-center group/btn"
                  >
                    <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover/btn:scale-110 transition-transform duration-300">
                      <Play className="h-6 w-6 fill-white ml-0.5" />
                    </div>
                  </button>
                </div>

                {/* Card Content */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-base line-clamp-2 text-stone-900 group-hover:text-primary transition-colors leading-snug">
                      {video.title}
                    </h3>

                    {video.ustadzName && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{video.ustadzName}</span>
                      </div>
                    )}

                    {video.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setActiveVideo(video)}
                      className="rounded-full text-xs font-bold gap-1.5 h-9 px-4 bg-primary hover:bg-primary/90"
                    >
                      <Play className="h-3 w-3 fill-current" /> Tonton
                    </Button>

                    <div className="flex items-center gap-1">
                      <a
                        href={video.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">YouTube</span>
                      </a>

                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus kajian "${video.title}"?`)) {
                              deleteMutation.mutate(video.id);
                            }
                          }}
                          className="h-8 w-8 rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-none bg-stone-950 text-white">
          <DialogHeader className="p-6 pb-2 text-left">
            <div className="flex items-center justify-between gap-4">
              <Badge className="bg-red-600 text-white font-bold text-xs uppercase px-2.5 py-0.5">
                {formatCategoryBadge(activeVideo?.category)}
              </Badge>
              {activeVideo && (
                <a
                  href={activeVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-400 hover:text-white flex items-center gap-1"
                >
                  Buka di YouTube <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <DialogTitle className="text-xl md:text-2xl font-display font-bold mt-2 text-white">
              {activeVideo?.title}
            </DialogTitle>
            {activeVideo?.ustadzName && (
              <DialogDescription className="text-stone-300 font-semibold flex items-center gap-1.5 pt-1">
                <User className="h-4 w-4 text-primary" /> {activeVideo.ustadzName}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* YouTube Responsive Embed */}
          <div className="relative aspect-video w-full bg-black">
            {activeVideo && (
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeVideoId}?autoplay=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            )}
          </div>

          {activeVideo?.description && (
            <div className="p-6 pt-4 text-xs md:text-sm text-stone-400 leading-relaxed max-h-36 overflow-y-auto">
              <p className="font-bold text-stone-200 mb-1">Ringkasan Materi:</p>
              {activeVideo.description}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Video Modal Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6 md:p-8 bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-stone-900 flex items-center gap-2">
              <Video className="h-6 w-6 text-red-600" /> Tambah Rekaman Kajian
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-500">
              Masukkan tautan video YouTube kajian masjid. Thumbnail dan ID video akan diekstrak otomatis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Judul Kajian <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="Contoh: Tafsir Surat Al-Kahfi Ayat 1-10"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Nama Ustadz / Pemateri
                </label>
                <Input
                  placeholder="Contoh: Ustadz Adi Hidayat, Lc., M.A."
                  value={formUstadz}
                  onChange={(e) => setFormUstadz(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Durasi Video
                </label>
                <Input
                  placeholder="Contoh: 45:20 atau 1 jam"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                URL Video YouTube <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="rounded-xl h-11"
              />
              {extractedVideoId && (
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200 mt-2">
                  <img
                    src={previewThumbnail}
                    alt="Preview"
                    className="w-24 h-14 object-cover rounded-lg shadow-sm"
                  />
                  <div className="text-xs text-stone-600">
                    <p className="font-bold text-emerald-600">ID Terdeteksi: {extractedVideoId}</p>
                    <p className="text-stone-400">Thumbnail YouTube otomatis disematkan</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Kategori Kajian
              </label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Ringkasan / Catatan Materi Kajian
              </label>
              <Textarea
                placeholder="Tuliskan poin-poin pembahasan atau deskripsi singkat kajian ini..."
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="rounded-xl resize-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-full px-5"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !formTitle || !extractedVideoId}
                className="rounded-full px-6 font-bold bg-primary hover:bg-primary/90"
              >
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan Rekaman'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
