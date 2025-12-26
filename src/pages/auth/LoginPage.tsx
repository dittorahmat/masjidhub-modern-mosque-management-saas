import React, { useState } from 'react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { useAppActions } from '@/lib/store';
import { toast } from 'sonner';
import { Landmark, ShieldAlert } from 'lucide-react';
import type { AppUser, Tenant } from '@shared/types';
export default function LoginPage() {
  const navigate = useNavigate();
  const actions = useAppActions();
  const setUser = actions.setUser;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@masjidhub.com');
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await api<{ user: AppUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setUser(user);
      toast.success('Selamat datang kembali!');
      if (user.role === 'superadmin_platform') {
        navigate('/super-admin/dashboard');
      } else if (user.tenantIds.length > 0) {
        try {
          // Attempt to find the first tenant slug for redirection
          const { items } = await api<{ items: Tenant[] }>('/api/super/tenants');
          const myTenant = items.find(t => user.tenantIds.includes(t.id));
          if (myTenant) {
            navigate(`/app/${myTenant.slug}/dashboard`);
          } else {
            navigate('/app/al-hikmah/dashboard');
          }
        } catch {
          navigate('/app/al-hikmah/dashboard');
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };
  return (
    <MarketingLayout>
      <div className="max-w-md mx-auto py-24 px-4">
        <div className="illustrative-card p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold">Masuk ke Portal</h1>
            <p className="text-muted-foreground text-sm">Kelola masjid Anda dengan transparansi digital.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-stone-50"
                placeholder="admin@masjid.org"
              />
              <p className="text-[10px] text-muted-foreground italic">Gunakan admin@masjidhub.com untuk Platform Admin.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                defaultValue="password"
                className="bg-stone-50"
                readOnly
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg rounded-xl" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
            </Button>
          </form>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold">Mode Demo Aktif</p>
              <p>Masukkan email apa saja untuk login sebagai admin reguler.</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Belum punya akun? <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/register')}>Daftar Masjid</Button>
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}