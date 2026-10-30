import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Landmark, Calendar, MapPin, Wallet, ArrowRight, 
  LayoutDashboard, Copy, Check, Home, User, 
  Clock, Download, FileText, Share2, Heart,
  Video, Play, ExternalLink, Youtube
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { Tenant, Event, PrayerSchedule, OrganizationMember, KajianVideo } from '@shared/types';
import { ChatWindow } from '@/components/features/ai/chat-window';

export default function PublicPortalPage() {
  const { slug } = useParams();
  const user = useAppStore(s => s.user);
  const [copied, setCopied] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [activeKajianVideo, setActiveKajianVideo] = useState<KajianVideo | null>(null);

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

  const { data: kajianVideos = [] } = useQuery({
    queryKey: ['kajian-videos', slug],
    queryFn: () => api<KajianVideo[]>(`/api/${slug}/kajian-videos`),
    enabled: !!slug
  });

  const handleCopyBank = () => {
    if (tenant?.bankInfo) {
      navigator.clipboard.writeText(tenant.bankInfo);
      setCopied(true);
      toast.success('Informasi rekening disalin');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const qrisUrl = tenant?.qrisImageUrl || '/qris-masjid.jpeg';

  const handleDownloadQris = async () => {
    try {
      const response = await fetch(qrisUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qris-${tenant?.slug || 'masjid'}.jpeg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('QRIS berhasil diunduh');
    } catch {
      window.open(qrisUrl, '_blank');
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

      {/* Prayer Schedule Tiles (Issue #3: Adapt) */}
      <section className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6">
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p, idx) => {
            const sched = schedules.find(s => s.prayerTime === p);
            const pName = p === 'fajr' ? 'Subuh' : p === 'dhuhr' ? 'Dzuhur' : p === 'asr' ? 'Ashar' : p === 'maghrib' ? 'Maghrib' : 'Isya';
            
            return (
              <motion.div 
                key={p}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="bg-slate-900/95 backdrop-blur-xl text-white p-6 md:p-8 rounded-[2rem] shadow-2xl border border-white/10 flex flex-col items-center justify-center space-y-3 group hover:bg-primary transition-all duration-500 cursor-default"
              >
                <span className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs group-hover:text-white/80 transition-colors">
                  {pName}
                </span>
                <span className="text-3xl md:text-5xl font-mono font-black tracking-tighter">
                  {sched?.time || '--:--'}
                </span>
                {sched?.imamName ? (
                  <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <User className="h-3 w-3" />
                    <span className="text-[10px] font-bold truncate max-w-[80px] uppercase tracking-wider">
                      {sched.imamName.split(' ')[0]}
                    </span>
                  </div>
                ) : (
                  <div className="h-4" /> // Spacer to maintain height
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-20 space-y-32">
        
        {/* Lokasi & Donasi Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 illustrative-card p-8 md:p-12">
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
                <div className="flex items-center justify-between">
                  <div className="inline-flex p-3 bg-white/10 rounded-2xl">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1 text-xs font-semibold">
                    QRIS & Transfer
                  </Badge>
                </div>
                <h2 className="text-3xl font-display font-bold">Infaq & Shadaqah</h2>
                <p className="text-primary-foreground/80 leading-relaxed">
                  Bantu operasional dan kegiatan dakwah masjid dengan donasi terbaik Anda melalui QRIS resmi atau rekening.
                </p>

                {/* QRIS Preview Card */}
                <div className="bg-white rounded-2xl p-4 text-slate-900 shadow-md flex items-center gap-4">
                  <div className="w-20 h-20 bg-stone-50 rounded-xl overflow-hidden border border-stone-200 shrink-0 p-1 flex items-center justify-center">
                    <img 
                      src={qrisUrl} 
                      alt="QRIS Donasi" 
                      className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setDonationOpen(true)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Scan QRIS Nasional</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tenant.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setDonationOpen(true)}
                        className="h-7 text-xs px-2.5 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                      >
                        Lihat QRIS
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleDownloadQris}
                        className="h-7 text-xs px-2 rounded-lg text-slate-600 hover:text-slate-900 gap-1"
                      >
                        <Download className="h-3 w-3" /> Unduh
                      </Button>
                    </div>
                  </div>
                </div>
             </div>

             <div className="mt-6 space-y-4 relative z-10">
                <div className="p-4 bg-white/10 rounded-2xl border border-white/20 flex justify-between items-center group cursor-pointer hover:bg-white/20 transition-all" onClick={handleCopyBank}>
                  <div className="truncate pr-4">
                    <p className="text-[10px] uppercase font-bold text-primary-foreground/60 mb-1">No. Rekening Masjid</p>
                    <code className="text-sm font-mono font-bold">{tenant.bankInfo || "Bank Syariah Indonesia (BSI) - Hubungi DKM"}</code>
                  </div>
                  <Button size="icon" variant="ghost" className="shrink-0 hover:bg-transparent text-white">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <Dialog open={donationOpen} onOpenChange={setDonationOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-12 font-bold shadow-lg shadow-black/10">
                       Sumbang Sekarang (QRIS)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] border-none p-8 max-w-md bg-white">
                    <DialogHeader className="text-center sm:text-center space-y-2">
                      <DialogTitle className="text-2xl font-display font-bold">Donasi & Infaq Masjid</DialogTitle>
                      <CardDescription className="text-sm font-medium">
                        Pindai kode QRIS di bawah ini menggunakan aplikasi mobile banking atau e-wallet apa saja (GoPay, OVO, Dana, LinkAja, BCA, BSI, Mandiri, dll).
                      </CardDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                      {/* QRIS Image Display */}
                      <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-56 h-56 bg-white p-2 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center">
                          <img 
                            src={qrisUrl} 
                            alt={`QRIS ${tenant.name}`} 
                            className="w-full h-full object-contain rounded-xl"
                          />
                        </div>
                        <p className="mt-3 font-display font-bold text-base text-slate-800">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">NMID / Standar Pembayaran QRIS Nasional</p>
                      </div>

                      {/* Download Button */}
                      <Button 
                        onClick={handleDownloadQris}
                        variant="outline" 
                        className="w-full rounded-2xl h-12 font-bold gap-2 border-stone-200 hover:bg-stone-50"
                      >
                        <Download className="h-4 w-4 text-primary" /> Unduh Gambar QRIS
                      </Button>

                      {/* Bank Info Fallback */}
                      <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transfer Bank Manual</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={handleCopyBank}
                            className="h-7 text-xs px-2 gap-1 font-bold text-primary"
                          >
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copied ? "Tersalin" : "Salin Rekening"}
                          </Button>
                        </div>
                        <p className="text-sm font-mono font-bold text-slate-800 break-words">
                          {tenant.bankInfo || "Bank Syariah Indonesia (BSI) - Konfirmasi ke Pengurus DKM"}
                        </p>
                        {tenant.bankAccounts && tenant.bankAccounts.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-stone-200">
                            {tenant.bankAccounts.map((acc, idx) => (
                              <div key={idx} className="text-xs flex justify-between text-slate-600">
                                <span className="font-medium">{acc.bankName}: {acc.accountNumber}</span>
                                <span className="text-muted-foreground">a.n. {acc.holderName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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

        {/* Organization Structure */}
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
                 <Card key={idx} className="illustrative-card p-8 flex flex-col justify-between hover:bg-stone-50 transition-colors border-none shadow-none hover:shadow-none">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px] px-3 font-black">Khutbah</Badge>
                        <span className="text-xs text-muted-foreground font-bold italic">{sched.khatibName || "Khatib Masjid"}</span>
                      </div>
                      <h4 className="text-xl font-display font-bold leading-snug">{sched.khutbahTopic}</h4>
                    </div>
                    <div className="mt-8 pt-6 border-t flex justify-between items-center">
                       <Button variant="ghost" size="sm" className="gap-2 text-primary font-black hover:bg-primary/5 rounded-xl">
                         <FileText className="h-4 w-4" /> Baca Materi
                       </Button>
                       <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 shadow-sm">
                         <Download className="h-4 w-4" />
                       </Button>
                    </div>
                 </Card>
               ))}
            </div>
          </section>
        )}

        {/* Kajian Videos Section */}
        {kajianVideos.length > 0 && (
          <section className="space-y-10">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-600 font-bold text-xs uppercase tracking-wider">
                <Youtube className="h-4 w-4" /> Video Kajian YouTube
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold">Rekaman Kajian Ilmiah</h2>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                Tonton rekaman ceramah, pengajian tafsir, dan kajian tematik dari asatidz masjid kami kapan saja.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {kajianVideos.map((video) => {
                const thumb = video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="illustrative-card overflow-hidden h-full flex flex-col group p-0 border-none shadow-none hover:shadow-xl hover:translate-y-[-2px] transition-all bg-white rounded-3xl">
                      {/* Video Thumbnail */}
                      <div className="aspect-video w-full overflow-hidden relative bg-stone-900">
                        <img
                          src={thumb}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />

                        {/* Duration Badge */}
                        {video.duration && (
                          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{video.duration}</span>
                          </div>
                        )}

                        {/* Category Badge */}
                        {video.category && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-white/95 backdrop-blur-md text-stone-900 border-none font-bold text-[10px] px-2.5 py-1 rounded-full shadow-sm capitalize">
                              {video.category.replace('_', ' ')}
                            </Badge>
                          </div>
                        )}

                        {/* Play Action Trigger */}
                        <button
                          onClick={() => setActiveKajianVideo(video)}
                          aria-label={`Tonton ${video.title}`}
                          className="absolute inset-0 flex items-center justify-center group/btn"
                        >
                          <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover/btn:scale-110 transition-transform duration-300">
                            <Play className="h-6 w-6 fill-white ml-0.5" />
                          </div>
                        </button>
                      </div>

                      {/* Video Info */}
                      <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-display font-bold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {video.title}
                          </h3>

                          {video.ustadzName && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600">
                              <User className="h-3.5 w-3.5 text-primary" />
                              <span className="truncate">{video.ustadzName}</span>
                            </div>
                          )}

                          {video.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {video.description}
                            </p>
                          )}
                        </div>

                        {/* Buttons */}
                        <div className="pt-3 border-t flex items-center justify-between gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setActiveKajianVideo(video)}
                            className="rounded-full text-xs font-bold gap-1.5 h-10 px-5 shadow-sm"
                          >
                            <Play className="h-3 w-3 fill-current" /> Tonton Video
                          </Button>

                          <a
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>YouTube</span>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
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

      {/* Modal Video Player Kajian */}
      <Dialog open={!!activeKajianVideo} onOpenChange={(open) => !open && setActiveKajianVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-none bg-stone-950 text-white">
          <DialogHeader className="p-6 pb-2 text-left">
            <div className="flex items-center justify-between gap-4">
              <Badge className="bg-red-600 text-white font-bold text-xs uppercase px-2.5 py-0.5">
                {activeKajianVideo?.category?.replace('_', ' ') || 'Kajian'}
              </Badge>
              {activeKajianVideo && (
                <a
                  href={activeKajianVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-400 hover:text-white flex items-center gap-1"
                >
                  Buka di YouTube <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <DialogTitle className="text-xl md:text-2xl font-display font-bold mt-2 text-white">
              {activeKajianVideo?.title}
            </DialogTitle>
            {activeKajianVideo?.ustadzName && (
              <DialogDescription className="text-stone-300 font-semibold flex items-center gap-1.5 pt-1">
                <User className="h-4 w-4 text-primary" /> {activeKajianVideo.ustadzName}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* YouTube Responsive Embed */}
          <div className="relative aspect-video w-full bg-black">
            {activeKajianVideo && (
              <iframe
                src={`https://www.youtube.com/embed/${activeKajianVideo.youtubeVideoId}?autoplay=1`}
                title={activeKajianVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            )}
          </div>

          {activeKajianVideo?.description && (
            <div className="p-6 pt-4 text-xs md:text-sm text-stone-400 leading-relaxed max-h-36 overflow-y-auto">
              <p className="font-bold text-stone-200 mb-1">Ringkasan Materi:</p>
              {activeKajianVideo.description}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating AI Chat Widget */}
      {tenant && (
        <ChatWindow slug={slug!} mosqueName={tenant.name} />
      )}

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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="illustrative-card overflow-hidden h-full flex flex-col group p-0 border-none shadow-none hover:shadow-none hover:translate-y-0">
        <div className="h-64 overflow-hidden relative">
          <img 
            src={event.imageUrl || "https://images.unsplash.com/photo-1519810755548-39cd217da494?auto=format&fit=crop&q=80"} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-4 left-4">
             <Badge className="bg-white/90 backdrop-blur-md text-slate-900 font-bold px-4 py-1.5 rounded-full border-none shadow-sm">
                {format(event.date, 'dd MMM', { locale: id })}
             </Badge>
          </div>
        </div>
        <CardContent className="p-8 flex-1 flex flex-col">
          <div className="flex-1 space-y-4">
            <h3 className="text-2xl font-display font-bold leading-tight group-hover:text-primary transition-colors">{event.title}</h3>
            <p className="text-muted-foreground line-clamp-2 font-medium leading-relaxed">{event.description}</p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                <Clock className="h-4 w-4 text-primary" />
                {format(event.date, 'p', { locale: id })} WIB
              </div>
            </div>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full rounded-full h-14 mt-8 font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" disabled={isFull}>
                {isFull ? 'Kuota Penuh' : 'Ikuti Kegiatan'} <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-none p-10 illustrative-card">
              <DialogHeader>
                <DialogTitle className="text-3xl font-display font-bold">Pendaftaran Kegiatan</DialogTitle>
                <CardDescription className="text-lg font-medium">{event.title}</CardDescription>
              </DialogHeader>
              <form onSubmit={handleRegister} className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nama Lengkap</Label>
                  <Input id="name" name="name" required placeholder="Masukkan nama Anda" className="h-12 rounded-xl border-2 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nomor WhatsApp</Label>
                  <Input id="phone" name="phone" required type="tel" placeholder="0812..." className="h-12 rounded-xl border-2 focus:ring-primary" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-full font-bold text-lg" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Memproses...' : 'Konfirmasi Kehadiran'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </motion.div>
  );
}
