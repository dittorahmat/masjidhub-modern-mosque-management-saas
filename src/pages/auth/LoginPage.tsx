import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { useAppActions } from '@/lib/store';
import { toast } from 'sonner';
import { Landmark, ShieldAlert, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';
import type { AppUser, Tenant, UserRole } from '@shared/types';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const actions = useAppActions();
  const setUser = actions.setUser;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@masjidhub.com');
  const [selectedRole, setSelectedRole] = useState<UserRole>('dkm_admin');
  const isDemoMode = searchParams.get('demo') === 'true';

  const demoEmails: Record<UserRole, string> = {
    'superadmin_platform': 'admin@masjidhub.com',
    'dkm_admin': 'demo-dkm@masjid.org',
    'amil_zakat': 'demo-amil@masjid.org',
    'ustadz': 'demo-ustadz@masjid.org',
    'jamaah': 'demo-jamaah@masjid.org'
  };

  useEffect(() => {
    if (isDemoMode) {
      setEmail(demoEmails[selectedRole]);
      toast.info('Selamat datang di Mode Demo!', {
        description: 'Gunakan akun demo untuk mengeksplorasi fitur platform.'
      });
    }
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      setEmail(demoEmails[selectedRole]);
    }
  }, [selectedRole, isDemoMode]);

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
          const tenants = await api<Tenant[]>('/api/super/tenants');
          const myTenant = tenants.find(t => user.tenantIds.includes(t.id));
          if (myTenant) {
            navigate(`/app/${myTenant.slug}/dashboard`);
          } else {
            navigate('/app/al-hikmah/dashboard');
          }
        } catch (error) {
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
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(5,150,105,0.03)_0%,transparent_70%)]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[500px] relative z-10"
        >
          <div className="illustrative-card p-12 space-y-10 relative overflow-hidden border-none shadow-none hover:shadow-none hover:translate-y-0">
            {isDemoMode && (
              <div className="absolute top-0 right-0 bg-primary text-white px-6 py-1.5 rounded-bl-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 shadow-xl">
                <Sparkles className="h-3 w-3 fill-white animate-pulse" /> Mode Demo
              </div>
            )}
            
            <div className="text-center space-y-4">
              <div className="mx-auto bg-stone-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border-2 border-stone-100">
                <Landmark className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl font-display font-black italic tracking-tighter text-slate-900 leading-none">Masuk ke Portal.</h1>
              <p className="text-muted-foreground font-medium text-lg italic">Akses manajemen masjid Anda yang aman dan transparan.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              {isDemoMode && (
                <div className="space-y-3">
                  <Label htmlFor="role" className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground ml-1">Pilih Peran Simulasi</Label>
                  <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold focus:ring-primary bg-white">
                      <SelectValue placeholder="Pilih peran demo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 shadow-2xl">
                      <SelectItem value="superadmin_platform">Super Admin Platform</SelectItem>
                      <SelectItem value="dkm_admin">Admin DKM (Penuh)</SelectItem>
                      <SelectItem value="amil_zakat">Amil Zakat (ZIS)</SelectItem>
                      <SelectItem value="ustadz">Ustadz (Kajian)</SelectItem>
                      <SelectItem value="jamaah">Jamaah (Forum)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3 text-left">
                <Label htmlFor="email" className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground ml-1">Alamat Email</Label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                   <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-2xl border-2 pl-12 font-bold focus:ring-primary bg-white"
                    placeholder="admin@masjid.org"
                  />
                </div>
              </div>

              <div className="space-y-3 text-left">
                <Label htmlFor="password" className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground ml-1">Kata Sandi</Label>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                   <Input
                    id="password"
                    type="password"
                    defaultValue="password"
                    className="h-14 rounded-2xl border-2 pl-12 font-bold bg-stone-50/50 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-20 text-xl rounded-full font-black shadow-2xl shadow-primary/30 bg-primary group" disabled={loading}>
                {loading ? 'Memproses...' : (
                  <span className="flex items-center gap-3">
                    Masuk Sekarang <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="p-6 bg-stone-50 rounded-[2rem] border-2 border-stone-100 flex gap-4">
              <ShieldAlert className="h-6 w-6 text-primary shrink-0 opacity-50" />
              <div className="text-xs text-muted-foreground space-y-1 text-left leading-relaxed">
                <p className="font-black uppercase tracking-widest text-slate-800">Sistem Keamanan Aktif</p>
                <p className="font-medium">Data Anda dilindungi dengan enkripsi end-to-end. Pastikan Anda masuk menggunakan kredensial resmi DKM.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </MarketingLayout>
  );
}
