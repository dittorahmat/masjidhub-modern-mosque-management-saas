import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from '@shared/youtube';
import { ParsedKajianMetadata, KAJIAN_CATEGORIES } from '@shared/types';
import { Sparkles, Youtube, Loader2, Bot } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export { KAJIAN_CATEGORIES } from "@shared/types";

interface AddKajianDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    ustadzName: string;
    youtubeUrl: string;
    youtubeVideoId: string;
    duration: string;
    category: string;
    description: string;
  }) => void;
  isPending: boolean;
}

export function AddKajianDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: AddKajianDialogProps) {
  const [title, setTitle] = useState('');
  const [ustadzName, setUstadzName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('kajian_tematik');
  const [description, setDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const { slug } = useParams();

  const handleAutoFill = async () => {
    if (!slug) {
      toast.error('Konteks masjid tidak ditemukan');
      return;
    }
    if (!youtubeUrl.trim()) {
      toast.error('Silakan masukkan URL YouTube terlebih dahulu');
      return;
    }
    const vId = extractYoutubeVideoId(youtubeUrl.trim());
    if (!vId) {
      toast.error('URL YouTube belum valid');
      return;
    }

    setIsParsing(true);
    try {
      const result = await api<ParsedKajianMetadata>(`/api/${slug}/kajian-videos/parse-url`, {
        method: 'POST',
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });

      if (result) {
        if (result.title) setTitle(result.title);
        if (result.ustadzName) setUstadzName(result.ustadzName);
        if (result.category) setCategory(result.category);
        if (result.duration) setDuration(result.duration);
        if (result.summary || result.description) setDescription(result.summary || result.description || '');
        toast.success('Metadata video berhasil diisi otomatis!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengambil metadata YouTube');
    } finally {
      setIsParsing(false);
    }
  };

  const detectedVideoId = extractYoutubeVideoId(youtubeUrl);
  const previewThumbnail = detectedVideoId ? getYoutubeThumbnailUrl(detectedVideoId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeUrl.trim() || !detectedVideoId) return;

    onSubmit({
      title: title.trim(),
      ustadzName: ustadzName.trim(),
      youtubeUrl: youtubeUrl.trim(),
      youtubeVideoId: detectedVideoId,
      duration: duration.trim(),
      category,
      description: description.trim(),
    });

    setTitle('');
    setUstadzName('');
    setYoutubeUrl('');
    setDuration('');
    setDescription('');
    setCategory('kajian_tematik');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Youtube className="w-5 h-5 text-rose-600" />
            Tambah Rekaman Video Kajian
          </DialogTitle>
          <DialogDescription>
            Masukkan tautan video YouTube kajian untuk ditampilkan pada galeri masjid dan portal publik.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">Tautan / URL YouTube *</label>
            <Input
              placeholder="Contoh: https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              required
            />
            {detectedVideoId ? (
              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={previewThumbnail!} alt="Preview" className="w-20 h-12 object-cover rounded" />
                  <div className="text-xs text-emerald-800">
                    <p className="font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> ID YouTube Terdeteksi:
                    </p>
                    <p className="font-mono text-stone-600">{detectedVideoId}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isParsing}
                  onClick={handleAutoFill}
                  className="min-h-[44px] border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-2 self-start sm:self-auto"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      Menganalisis...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 text-emerald-700" />
                      Auto-Fill dengan AI
                    </>
                  )}
                </Button>
              </div>
            ) : youtubeUrl.length > 5 ? (
              <p className="text-xs text-rose-500">Format tautan YouTube belum valid</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">Judul Kajian *</label>
            <Input
              placeholder="Contoh: Meneladani Akhlak Rasulullah SAW dalam Kehidupan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Pemateri / Ustadz</label>
              <Input
                placeholder="Contoh: Ustadz Dr. Firanda Andirja"
                value={ustadzName}
                onChange={(e) => setUstadzName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Estimasi Durasi</label>
              <Input
                placeholder="Contoh: 45:10 atau 1 jam"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">Kategori Kajian</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                {KAJIAN_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">Ringkasan Materi / Catatan</label>
            <Textarea
              placeholder="Tuliskan intisari ringkas materi kajian yang disampaikan..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || !detectedVideoId || !title.trim()}
              className="bg-primary hover:bg-primary/95 text-white"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Rekaman Kajian'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
