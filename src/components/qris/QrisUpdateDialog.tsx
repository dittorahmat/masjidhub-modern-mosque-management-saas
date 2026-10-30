import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShieldCheck, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QrisUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (url: string) => void;
  isPending: boolean;
}

export const QrisUpdateDialog: React.FC<QrisUpdateDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  isPending,
}) => {
  const [newQrisUrl, setNewQrisUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengunggah gambar');
      }

      setNewQrisUrl(json.data.url);
      toast.success('File berhasil diunggah! Klik Simpan untuk memperbarui.');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!newQrisUrl.trim()) {
      toast.error('Masukkan URL gambar atau unggah file terlebih dahulu');
      return;
    }
    onSave(newQrisUrl.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg p-6 bg-white border-stone-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Kelola Barcode QRIS Masjid
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Perbarui gambar QRIS resmi masjid Anda. Gambar ini akan tampil di seluruh aplikasi, dashboard, dan portal publik.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="qrisUrlInput" className="text-xs font-bold uppercase text-stone-600">
              URL Gambar QRIS
            </Label>
            <Input
              id="qrisUrlInput"
              placeholder="https://... atau /api/storage/..."
              value={newQrisUrl}
              onChange={(e) => setNewQrisUrl(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-stone-400 absolute">
              ATAU UNGGAH LANGSUNG
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-stone-600">
              Upload File Gambar QRIS
            </Label>
            <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all cursor-pointer relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center gap-2">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-stone-400" />
                )}
                <p className="text-xs font-semibold text-stone-700">
                  {isUploading ? 'Sedang mengunggah...' : 'Pilih atau seret gambar QRIS ke sini'}
                </p>
                <p className="text-[11px] text-stone-400">PNG, JPG, atau WebP (Maks 5MB)</p>
              </div>
            </div>
          </div>

          {newQrisUrl && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
              <img
                src={newQrisUrl}
                alt="Preview QRIS"
                className="w-12 h-12 object-contain bg-white rounded-lg border p-1"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-800">Preview Gambar Siap Digunakan</p>
                <p className="text-[11px] text-stone-500 truncate">{newQrisUrl}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || isUploading}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Simpan QRIS Baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
