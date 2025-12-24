import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Landmark, Calendar, MapPin, Wallet, ArrowRight, LayoutDashboard, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Tenant, Event } from '@shared/types';
export default function PublicPortalPage() {
  const { slug } = useParams();
  const user = useAppStore(s => s.user);
  const [copied, setCopied] = useState(false);
  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ['tenants', slug],
    queryFn: () => api<Tenant>(`/api/tenants/${slug}`)
  });
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['events', slug],
    queryFn: () => api<Event[]>(`/api/${slug}/events`)
  });
  const handleCopyBank = () => {
    if (tenant?.bankInfo) {
      navigator.clipboard.writeText(tenant.bankInfo);
      setCopied(true);
      toast.success('Informasi rekening disalin');
      setTimeout(() => setCopied(false), 2000);
    }
  };
  if (loadingTenant) return <div className="h-screen flex items-center justify-center">Memuat portal...</div>;
  if (!tenant) return <div className="h-screen flex items-center justify-center text-center p-4">Portal tidak ditemukan.</div>;
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Quick Switch */}
      {user && user.tenantIds.includes(tenant.id) && (
        <div className="bg-primary/5 border-b py-2 px-4 flex justify-between items-center text-xs">
          <span className="text-primary font-bold">Anda adalah pengurus masjid ini.</span>
          <Link to={`/app/${slug}/dashboard`}>
            <Button variant="link" size="sm" className="h-auto p-0 gap-1">
              <LayoutDashboard className="h-3 w-3" /> Kembali ke Dasbor
            </Button>
          </Link>
        </div>
      )}
      {/* Hero Header */}
      <header className="bg-primary text-white py-16 px-4 md:py-24 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="max-w-7xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex p-4 bg-white/10 rounded-2xl backdrop-blur-sm mb-4">
            <Landmark className="h-12 w-12 opacity-90" />
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">{tenant.name}</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-3xl mx-auto font-medium">
            {tenant.bio || "Selamat datang di ruang komunitas digital kami."}
          </p>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 space-y-16 pb-24">
        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="illustrative-card p-8 group hover:shadow-xl transition-all">
            <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary group-hover:bounce" /> Lokasi
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-lg">
              {tenant.address || "Hubungi pengurus masjid untuk detail lokasi."}
            </p>
            <Button variant="link" className="p-0 mt-4 text-primary font-bold">Lihat di Google Maps</Button>
          </Card>
          <Card className="illustrative-card p-8 group hover:shadow-xl transition-all">
            <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" /> Dukung Kami
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Infaq dan Sadaqoh Anda membantu kami melayani ummat dengan lebih baik.
            </p>
            <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-primary/20 relative group/bank">
              <code className="text-sm text-emerald-800 break-words whitespace-pre-line block pr-10 font-mono">
                {tenant.bankInfo || "Informasi rekening segera hadir."}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 text-primary hover:bg-primary/10"
                onClick={handleCopyBank}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        </div>
        {/* Events Section */}
        <section className="space-y-10 py-12 md:py-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-display font-bold">Kegiatan Mendatang</h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Bergabunglah dalam program kami dan jadilah bagian aktif dari komunitas.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.filter(e => e.date > Date.now()).length === 0 ? (
              <div className="col-span-full py-24 text-center text-muted-foreground italic illustrative-card bg-stone-50">
                Belum ada kegiatan mendatang saat ini. Sering-sering cek kembali ya!
              </div>
            ) : (
              events.filter(e => e.date > Date.now()).map((event) => (
                <EventPublicCard key={event.id} event={event} slug={slug!} />
              ))
            )}
          </div>
        </section>
      </main>
      <footer className="border-t py-16 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Landmark className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="font-display font-bold text-xl text-foreground mb-2">{tenant.name}</p>
          <p className="text-muted-foreground mb-8">Rumah Ibadah Anda, Digital & Transparan.</p>
          <div className="h-px w-24 bg-stone-300 mx-auto mb-8" />
          <p className="text-sm text-muted-foreground">© 2024 Ditenagai oleh <span className="text-primary font-bold">MasjidHub</span></p>
        </div>
      </footer>
    </div>
  );
}
function EventPublicCard({ event, slug }: { event: Event, slug: string }) {
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: (data: any) => api(`/api/${slug}/events/${event.id}/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      setOpen(false);
      toast.success('Pendaftaran Berhasil!', {
        description: `Anda telah terdaftar untuk ${event.title}. Jazakallah Khairan.`
      });
    }
  });
  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    if (!data.name || !data.email) {
      toast.error('Mohon lengkapi formulir pendaftaran');
      return;
    }
    mutation.mutate(data);
  };
  const isFull = event.currentRegistrations >= event.capacity;
  return (
    <Card className="illustrative-card overflow-hidden h-full flex flex-col group hover:-translate-y-2 transition-all">
      <CardHeader className="bg-stone-50/50 pb-6">
        <div className="flex justify-between items-center mb-4">
          <Badge className="bg-emerald-600">Daftar Sekarang</Badge>
          <span className="text-xs font-bold text-muted-foreground">Sisa {event.capacity - event.currentRegistrations} Slot</span>
        </div>
        <CardTitle className="text-3xl font-display group-hover:text-primary transition-colors">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-8 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          <div className="space-y-3 text-foreground/80">
            <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /> {format(event.date, 'PPP p', { locale: id })}</div>
            <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /> {event.location}</div>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 text-lg rounded-2xl mt-4 shadow-lg group-hover:scale-[1.02] transition-all" disabled={isFull}>
              {isFull ? 'Kuota Penuh' : 'Daftar Gratis'} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Daftar untuk {event.title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input name="name" required placeholder="Ahmad Fikri" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Alamat Email</Label>
                <Input name="email" type="email" required placeholder="ahmad@email.com" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Nomor Telepon (WhatsApp)</Label>
                <Input name="phone" required placeholder="0812..." className="h-12" />
              </div>
              <Button type="submit" className="w-full h-14 text-lg rounded-2xl" disabled={mutation.isPending}>
                {mutation.isPending ? 'Memproses...' : 'Konfirmasi Pendaftaran'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}