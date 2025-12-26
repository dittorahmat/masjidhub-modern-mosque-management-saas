import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { useAppActions } from '@/lib/store';
import { toast } from 'sonner';
import { Landmark, ShieldAlert, Sparkles } from 'lucide-react';
import type { AppUser, Tenant } from '@shared/types';
export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const actions = useAppActions();
  const setUser = actions.setUser;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@masjidhub.com');
  const isDemoMode = searchParams.get('demo') === 'true';
  useEffect(() => {
    if (isDemoMode) {
      setEmail('demo@masjid.org');
      toast.info('Selamat datang di Mode Demo!', {
        description: 'Gunakan akun demo untuk mengeksplorasi fitur platform.'
      });
    }
  }, [isDemoMode]);
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
        <div className="illustrative-card p-10 space-y-8 relative overflow-hidden">
          {isDemoMode && (
            <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Mode Demo
            </div>
          )}
          <div className="text-center space-y-2">
            <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold">Masuk ke Portal</h1>
            <p className="text-muted-foreground text-sm">Akses manajemen masjid Anda yang aman.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-stone-50 h-12"
                placeholder="admin@masjid.org"
              />
              <p className="text-[10px] text-muted-foreground italic">
                {isDemoMode ? 'Klik "Masuk Sekarang" untuk login demo.' : 'Gunakan email admin masjid Anda.'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                defaultValue="password"
                className="bg-stone-50 h-12"
                readOnly
              />
            </div>
            <Button type="submit" className="w-full h-14 text-lg rounded-xl shadow-lg" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
            </Button>
          </form>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold">Keamanan Platform</p>
              <p>Platform admin: admin@masjidhub.com. Demo admin: demo@masjid.org.</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Belum punya portal? <Button variant="link" className="p-0 h-auto font-bold" onClick={() => navigate('/register')}>Daftar Masjid</Button>
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}