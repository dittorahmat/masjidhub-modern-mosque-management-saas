import React, { useState } from 'react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Landmark } from 'lucide-react';
export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAppStore(s => s.setUser);
  const [loading, setLoading] = useState(false);
  const [email] = useState('admin@masjidhub.com');
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await api<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setUser(user);
      toast.success('Selamat datang kembali!');
      navigate('/app/al-hikmah/dashboard');
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
            <p className="text-muted-foreground">Kelola masjid Anda dengan transparansi digital.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input 
                id="email" 
                type="email" 
                defaultValue={email} 
                className="bg-stone-50"
                placeholder="admin@masjid.org"
                readOnly
              />
              <p className="text-[10px] text-muted-foreground italic">Gunakan email demo di atas untuk masuk.</p>
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