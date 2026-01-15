import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Landmark, Calendar, MapPin, Wallet, ArrowRight, 
  LayoutDashboard, Copy, Check, Home, User, 
  Clock, Download, FileText, Share2, Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Tenant, Event, PrayerSchedule, OrganizationMember } from '@shared/types';

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

  const { data: schedules = [] } = useQuery({
    queryKey: ['prayer-schedules', slug],
    queryFn: () => api<PrayerSchedule[]>(`/api/${slug}/prayer-schedules`)
  });

  const { data: members = [] } = useQuery({
    queryKey: ['org-members', slug],
    queryFn: () => api<OrganizationMember[]>(`/api/${slug}/organization`)
  });

  const handleCopyBank = () => {
    if (tenant?.bankInfo) {
      navigator.clipboard.writeText(tenant.bankInfo);
      setCopied(true);
      toast.success('Informasi rekening disalin');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loadingTenant) return <div className="h-screen flex items-center justify-center bg-stone-50">
    <div className="flex flex-col items-center gap-4">
      <Landmark className="h-12 w-12 text-primary animate-pulse" />
      <p className="text-muted-foreground font-medium">Menyiapkan portal masjid...</p>
    </div>
  </div>;

  if (!tenant) return <div className="h-screen flex flex-col items-center justify-center text-center p-4 space-y-4">
    <p className="text-xl font-display font-bold">Portal tidak ditemukan.</p>
    <Link to="/"><Button variant="outline">Kembali ke Beranda</Button></Link>
  </div>;

  const fundraisingEvents = events.filter(e => e.isFundraising);
  const regularEvents = events.filter(e => !e.isFundraising);
  const khutbahArchive = schedules.filter(s => s.khutbahTopic);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900">
      {/* Top Bar with Running Text */}
      <div className="bg-primary text-white py-2 overflow-hidden whitespace-nowrap relative z-[60]">
        <div className="inline-block animate-marquee-fast px-4 font-bold text-sm uppercase tracking-wider">
           📢 {tenant.runningText || "Selamat datang di Portal Digital " + tenant.name + " - Mari makmurkan masjid bersama-sama."} 
           &nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;
           🕌 Jadwal Shalat Update Setiap Hari 
           &nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;
           ✨ Zakat & Infaq dapat dilakukan via QRIS
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-primary">
            <Landmark className="h-6 w-6" />
            <span>MasjidHub</span>
          </Link>
          <div className="flex items-center gap-3">
            {user && user.tenantIds.includes(tenant.id) ? (
              <Link to={`/app/${slug}/dashboard`}>
                <Button variant="default" size="sm" className="rounded-full gap-2 px-6 shadow-md hover:shadow-lg transition-all">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard Admin
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="rounded-full px-6">Login Pengurus</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-20 px-4 md:py-32 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform origin-top-right translate-x-1/2" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-1.5 text-sm rounded-full mb-2">
              Profil Masjid Resmi
            </Badge>
            <h1 className="text-5xl md:text-8xl font-display font-black leading-[1.1] tracking-tight">
              {tenant.name}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              {tenant.bio || "Wadah syiar dakwah dan pemberdayaan ummat berbasis teknologi."}
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg shadow-xl shadow-primary/20 gap-2">
                <Heart className="h-5 w-5 fill-current" /> Infaq Sekarang
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg gap-2">
                <Calendar className="h-5 w-5" /> Lihat Kegiatan
              </Button>
            </div>
          </div>
          <div className="flex-1 w-full max-w-md">
             <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50" />
                <img 
                  src={tenant.logoUrl || "https://placehold.co/400x400?text=" + tenant.name} 
                  alt={tenant.name}
                  className="relative w-full aspect-square object-cover rounded-[3rem] shadow-2xl border-8 border-white"
                />
             </div>
          </div>
        </div>
      </header>

      {/* Prayer Schedule Ribbon */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-slate-900 text-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => {
            const sched = schedules.find(s => s.prayerTime === p);
            const pName = p === 'fajr' ? 'Subuh' : p === 'dhuhr' ? 'Dzuhur' : p === 'asr' ? 'Ashar' : p === 'maghrib' ? 'Maghrib' : 'Isya';
            return (
              <div key={p} className="text-center space-y-2 group">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs group-hover:text-primary transition-colors">{pName}</p>
                <p className="text-3xl md:text-4xl font-mono font-black">{sched?.time || '--:--'}</p>
                {sched?.imamName && (
                  <p className="text-[10px] text-slate-500 font-medium truncate italic">Imam: {sched.imamName}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-20 space-y-32">
        
        {/* Lokasi & Donasi Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-sm bg-white p-8 md:p-12">
             <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="flex-1 space-y-6">
                  <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-display font-bold">Lokasi Kami</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
                    {tenant.address || "Hubungi pengurus masjid untuk detail lokasi."}
                  </p>
                  <Button variant="link" className="p-0 text-primary font-bold text-lg">Buka di Google Maps →</Button>
                </div>
                <div className="w-full md:w-64 h-48 bg-slate-100 rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all cursor-pointer">
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">Preview Map</div>
                </div>
             </div>
          </Card>
          
          <Card className="rounded-[2rem] border-none shadow-sm bg-primary text-white p-8 md:p-10 flex flex-col justify-between overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
             <div className="space-y-6 relative z-10">
                <div className="inline-flex p-3 bg-white/10 rounded-2xl">
                  <Wallet className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-display font-bold">Infaq & Shadaqah</h2>
                <p className="text-primary-foreground/80 leading-relaxed">
                  Bantu operasional masjid dengan donasi terbaik Anda.
                </p>
             </div>
             <div className="mt-8 space-y-4 relative z-10">
                <div className="p-4 bg-white/10 rounded-2xl border border-white/20 flex justify-between items-center group cursor-pointer hover:bg-white/20 transition-all" onClick={handleCopyBank}>
                  <div className="truncate pr-4">
                    <p className="text-[10px] uppercase font-bold text-primary-foreground/60 mb-1">No. Rekening</p>
                    <code className="text-sm font-mono font-bold">{tenant.bankInfo || 'Segera Hadir'}</code>
                  </div>
                  <Button size="icon" variant="ghost" className="shrink-0 hover:bg-transparent text-white">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-12 font-bold shadow-lg shadow-black/10">
                   Sumbang Sekarang
                </Button>
             </div>
          </Card>
        </div>

        {/* Fundraising Programs */}
        {fundraisingEvents.length > 0 && (
          <section className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Program Pembangunan</h2>
              <p className="text-muted-foreground text-lg">Wujudkan jariyah dengan berkontribusi pada program fisik masjid.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {fundraisingEvents.map(event => (
                <Card key={event.id} className="rounded-[2rem] overflow-hidden border-none shadow-sm bg-white group hover:shadow-xl transition-all">
                  <div className="h-64 overflow-hidden relative">
                    <img 
                      src={event.imageUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80"} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-8 space-y-6">
                    <h3 className="text-2xl font-bold">{event.title}</h3>
                    <div className="space-y-3">
                       <div className="flex justify-between text-sm font-bold">
                          <span className="text-muted-foreground uppercase">Terkumpul</span>
                          <span className="text-primary">{Math.round(((event.collectedAmount || 0) / (event.targetAmount || 1)) * 100)}%</span>
                       </div>
                       <Progress value={((event.collectedAmount || 0) / (event.targetAmount || 1)) * 100} className="h-3 rounded-full" />
                       <div className="flex justify-between items-end">
                          <p className="text-xl font-black text-primary">Rp {(event.collectedAmount || 0).toLocaleString('id-ID')}</p>
                          <p className="text-sm text-muted-foreground">Target: Rp {(event.targetAmount || 0).toLocaleString('id-ID')}</p>
                       </div>
                    </div>
                    <Button className="w-full rounded-2xl h-12 font-bold gap-2">
                       Bantu Donasi <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Organization Structure (New Section) */}
        {members.length > 0 && (
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-display font-bold">Pengurus DKM</h2>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Kami yang berkhidmat melayani kebutuhan jamaah.</p>
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
              {members.sort((a,b) => a.order - b.order).map(member => (
                <div key={member.id} className="text-center space-y-4 group">
                  <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                        <User className="h-16 w-16 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-primary font-medium text-sm uppercase tracking-wider">{member.role}</p>
                    {member.bio && <p className="text-sm text-muted-foreground italic">"{member.bio}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Khutbah Archive */}
        {khutbahArchive.length > 0 && (
          <section className="space-y-10">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-display font-bold">Arsip Khutbah Jumat</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Pelajari kembali ringkasan materi khutbah dari khatib kami.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {khutbahArchive.map((sched, idx) => (
                 <Card key={idx} className="p-6 rounded-3xl border-none shadow-sm bg-white flex flex-col justify-between hover:bg-stone-50 transition-colors">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px] px-3 font-black">Khutbah</Badge>
                        <span className="text-xs text-muted-foreground font-medium">{sched.khatibName || "Khatib Masjid"}</span>
                      </div>
                      <h4 className="text-xl font-bold leading-snug">{sched.khutbahTopic}</h4>
                    </div>
                    <div className="mt-8 pt-6 border-t flex justify-between items-center">
                       <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold">
                         <FileText className="h-4 w-4" /> Baca Materi
                       </Button>
                       <Button size="icon" variant="secondary" className="rounded-full h-8 w-8">
                         <Download className="h-4 w-4" />
                       </Button>
                    </div>
                 </Card>
               ))}
            </div>
          </section>
        )}

        {/* Regular Events Section */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-display font-bold">Kegiatan Komunitas</h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Wadah silaturahmi dan menuntut ilmu bagi seluruh jamaah.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularEvents.filter(e => e.date > Date.now()).length === 0 ? (
              <div className="col-span-full py-24 text-center text-muted-foreground italic bg-white rounded-[3rem] shadow-sm">
                Belum ada kegiatan mendatang saat ini. Jazakallah Khairan atas kunjungannya.
              </div>
            ) : (
              regularEvents.filter(e => e.date > Date.now()).map((event) => (
                <EventPublicCard key={event.id} event={event} slug={slug!} />
              ))
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2 font-display font-bold text-2xl text-primary">
              <Landmark className="h-8 w-8" />
              <span>MasjidHub</span>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              Membangun peradaban masjid yang mandiri, transparan, dan berdaya melalui digitalisasi yang syar'i.
            </p>
          </div>
          <div className="space-y-8 md:text-right flex flex-col md:items-end">
            <h4 className="text-2xl font-bold">{tenant.name}</h4>
            <div className="h-px w-24 bg-primary/20" />
            <p className="text-sm font-medium text-slate-400">© 2024 Ditenagai oleh <span className="text-primary font-bold tracking-tight">MasjidHub.</span></p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee-fast {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-fast {
          animation: marquee-fast 20s linear infinite;
        }
      `}</style>
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
        description: `Konfirmasi pendaftaran untuk "${event.title}" telah diterima.`
      });
    }
  });

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    mutation.mutate(data);
  };

  const isFull = event.currentRegistrations >= event.capacity;

  return (
    <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-sm bg-white h-full flex flex-col group hover:-translate-y-2 transition-all">
      <div className="h-56 overflow-hidden relative">
        <img 
          src={event.imageUrl || "https://images.unsplash.com/photo-1519810755548-39cd217da494?auto=format&fit=crop&q=80"} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-8 flex-1 flex flex-col">
        <div className="flex-1 space-y-4">
          <h3 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors">{event.title}</h3>
          <p className="text-muted-foreground line-clamp-2">{event.description}</p>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              {format(event.date, 'PPP p', { locale: id })}
            </div>
          </div>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full rounded-2xl h-12 mt-8 font-bold gap-2" disabled={isFull}>
              {isFull ? 'Kuota Penuh' : 'Ikuti Kegiatan'} <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-none p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold">Pendaftaran Kegiatan</DialogTitle>
              <CardDescription className="text-lg">{event.title}</CardDescription>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input name="name" required placeholder="Ahmad Abdullah" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Alamat Email</Label>
                <Input name="email" type="email" required placeholder="ahmad@email.com" className="h-12 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-14 text-lg rounded-2xl font-bold" disabled={mutation.isPending}>
                {mutation.isPending ? 'Memproses...' : 'Konfirmasi Pendaftaran'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}