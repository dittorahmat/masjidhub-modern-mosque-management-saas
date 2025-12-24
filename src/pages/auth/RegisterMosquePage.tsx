import React, { useState } from 'react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
export function RegisterMosquePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    mosqueName: '',
    slug: ''
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      toast.success('Masjid berhasil didaftarkan!');
      navigate(`/app/${form.slug.toLowerCase()}/dashboard`);
    } catch (err: any) {
      toast.error(err.message || 'Pendaftaran gagal');
    } finally {
      setLoading(false);
    }
  };
  return (
    <MarketingLayout>
      <div className="max-w-md mx-auto py-20 px-4">
        <div className="illustrative-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold">Klaim Ruang Digital Anda</h1>
            <p className="text-muted-foreground">Bergabung dengan MasjidHub dan modernisasi operasional Anda.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Admin</Label>
              <Input id="name" required placeholder="Nama Lengkap" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input id="email" type="email" required placeholder="admin@masjid.org" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="border-t pt-4 space-y-2">
              <Label htmlFor="mosqueName">Nama Masjid</Label>
              <Input id="mosqueName" required placeholder="Masjid Al-Noor" value={form.mosqueName} onChange={e => setForm({...form, mosqueName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug URL Unik</Label>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs hidden sm:inline">masjidhub.com/app/</span>
                  <Input id="slug" required placeholder="al-noor" value={form.slug} onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-')})} />
                </div>
                <p className="text-[10px] text-muted-foreground italic">Gunakan huruf kecil dan tanda hubung saja.</p>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
              {loading ? 'Sedang Membuat...' : 'Luncurkan Portal Masjid'}
            </Button>
          </form>
        </div>
      </div>
    </MarketingLayout>
  );
}