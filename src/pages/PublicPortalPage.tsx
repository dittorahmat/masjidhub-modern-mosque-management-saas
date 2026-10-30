import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Landmark, Calendar, MapPin, Wallet, ArrowRight, 
  LayoutDashboard, Copy, Check, User, Download, FileText, Heart
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tenant, Event, PrayerSchedule, OrganizationMember, KajianVideo } from '@shared/types';
import { ChatWindow } from '@/components/features/ai/chat-window';
import { PublicDonationDialog } from '@/components/public/PublicDonationDialog';
import { PrayerScheduleRibbon } from '@/components/public/PrayerScheduleRibbon';
import { EventPublicCard } from '@/components/public/EventPublicCard';
import { PublicKajianSection } from '@/components/public/PublicKajianSection';

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

  const { data: events = [] } = useQuery({
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

  if (loadingTenant) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <Landmark className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground font-medium">Menyiapkan portal masjid...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center text-center p-4 space-y-4">
        <p className="text-xl font-display font-bold">Portal tidak ditemukan.</p>
        <Link to="/"><Button variant="outline" className="min-h-[44px]">Kembali ke Beranda</Button></Link>
      </div>
    );
  }

  const fundraisingEvents = events.filter(e => e.isFundraising);
  const regularEvents = events.filter(e => !e.isFundraising);
  const khutbahArchive = schedules.filter(s => s.khutbahTopic);

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] font-sans text-slate-900 pb-12">
      {/* Top Bar with Running Text */}
      <div className="bg-primary text-white py-2 overflow-hidden whitespace-nowrap relative z-[60]">
        <div className="inline-block animate-marquee-fast px-4 font-bold text-xs sm:text-sm font-medium">
           {tenant.runningText || "Selamat datang di Portal Digital " + tenant.name + " - Mari makmurkan masjid bersama-sama."} 
          &nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;
         Jadwal Shalat Terintegrasi 
          &nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;
         Zakat & Infaq Terverifikasi via QRIS
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg sm:text-xl text-primary shrink-0 min-h-[44px]">
            <Landmark className="h-6 w-6 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-xs">{tenant.name || 'MasjidHub'}</span>
          </Link>
          <div className="flex items-center gap-2">
            {user && user.tenantIds.includes(tenant.id) ? (
              <Link to={`/app/${slug}/dashboard`}>
                <Button variant="default" size="sm" className="rounded-full gap-2 px-4 sm:px-6 shadow-md min-h-[44px] text-xs sm:text-sm">
                  <LayoutDashboard className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Dashboard Admin</span>
                  <span className="sm:hidden">Dashboard</span>
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="rounded-full px-4 sm:px-6 min-h-[44px] text-xs sm:text-sm">
                  Login Pengurus
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-12 sm:py-20 px-4 md:py-28 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform origin-top-right translate-x-1/2 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 space-y-6 sm:space-y-8 text-center md:text-left">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-1.5 text-xs sm:text-sm rounded-full mb-2">
              Profil Masjid Resmi
            </Badge>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black leading-[1.1] tracking-tight text-slate-900">
              {tenant.name}
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              {tenant.bio || "Wadah syiar dakwah dan pemberdayaan ummat berbasis teknologi."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
              <Button 
                size="lg" 
                onClick={() => setDonationOpen(true)}
                className="rounded-full min-h-[48px] h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg   gap-2 w-full sm:w-auto"
              >
                <Heart className="h-5 w-5 fill-current" /> Infaq Sekarang
              </Button>
              <a href="#kegiatan" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full min-h-[48px] h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg gap-2 w-full"
                >
                  <Calendar className="h-5 w-5" /> Lihat Kegiatan
                </Button>
              </a>
            </div>
          </div>
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
            <div className="relative mx-auto">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50" />
              <img 
                src={tenant.logoUrl || "https://placehold.co/400x400?text=" + tenant.name} 
                alt={tenant.name}
                className="relative w-full aspect-square object-cover rounded-3xl sm:rounded-[3rem]  border-4 sm:border-8 border-white"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Prayer Schedule Ribbon */}
      <PrayerScheduleRibbon schedules={schedules} />

      <main className="max-w-7xl mx-auto px-4 py-16 sm:py-24 space-y-20 sm:space-y-32">
        {/* Lokasi & Donasi Section */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          <Card className="lg:col-span-2 illustrative-card p-6 sm:p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-6 sm:gap-10 items-start">
              <div className="flex-1 space-y-4 sm:space-y-6">
                <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold">Lokasi Kami</h2>
                <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed whitespace-pre-line">
                  {tenant.address || "Hubungi pengurus masjid untuk detail lokasi."}
                </p>
                <Button variant="link" className="p-0 text-primary font-bold text-base sm:text-lg min-h-[44px]">
                  Buka di Google Maps →
                </Button>
              </div>
              <div className="w-full md:w-64 h-44 sm:h-48 bg-slate-100 rounded-2xl sm:rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all flex items-center justify-center text-slate-400 font-bold text-sm">
                Preview Map
              </div>
            </div>
          </Card>
          
          {/* Infaq & Shadaqah Card */}
          <Card className="rounded-2xl sm:rounded-[2rem] border-none shadow-sm bg-primary text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <div className="space-y-5 sm:space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="inline-flex p-3 bg-white/10 rounded-2xl">
                  <Wallet className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1 text-xs font-semibold">
                  QRIS & Transfer
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold">Infaq & Shadaqah</h2>
              <p className="text-primary-foreground/90 text-sm sm:text-base leading-relaxed">
                Bantu operasional dan kegiatan dakwah masjid dengan donasi terbaik Anda melalui QRIS resmi atau transfer rekening.
              </p>

              {/* QRIS Quick Preview */}
              <div className="bg-white rounded-2xl p-4 text-slate-900 shadow-md flex items-center gap-3 sm:gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-50 rounded-xl overflow-hidden border border-stone-200 shrink-0 p-1 flex items-center justify-center">
                  <img 
                    src={qrisUrl} 
                    alt="QRIS Donasi" 
                    className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setDonationOpen(true)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Scan QRIS Nasional</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tenant.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setDonationOpen(true)}
                      className="min-h-[36px] h-8 text-xs px-2.5 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                    >
                      Buka QRIS
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleDownloadQris}
                      className="min-h-[36px] h-8 text-xs px-2 rounded-lg text-slate-600 hover:text-slate-900 gap-1"
                    >
                      <Download className="h-3 w-3" /> Unduh
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 sm:space-y-4 relative z-10">
              <div 
                className="p-3.5 sm:p-4 bg-white/10 rounded-2xl border border-white/20 flex justify-between items-center group cursor-pointer hover:bg-white/20 transition-all min-h-[44px]" 
                onClick={handleCopyBank}
              >
                <div className="truncate pr-3">
                  <p className="text-[10px] uppercase font-bold text-primary-foreground/70 mb-0.5">No. Rekening Masjid</p>
                  <code className="text-xs sm:text-sm font-mono font-bold">{tenant.bankInfo || "Bank Syariah Indonesia (BSI) - Hubungi DKM"}</code>
                </div>
                <Button size="icon" variant="ghost" className="shrink-0 hover:bg-transparent text-white min-h-[36px] min-w-[36px]">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <Button 
                onClick={() => setDonationOpen(true)}
                className="w-full bg-white text-primary hover:bg-white/95 rounded-2xl min-h-[48px] h-12 font-bold   text-sm sm:text-base"
              >
                Sumbang Sekarang (Pilih Nominal)
              </Button>
            </div>
          </Card>
        </div>

        {/* Fundraising Programs */}
        {fundraisingEvents.length > 0 && (
          <section className="space-y-8 sm:space-y-12">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight">Program Pembangunan</h2>
              <p className="text-muted-foreground text-sm sm:text-lg">Wujudkan jariyah dengan berkontribusi pada program fisik masjid.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {fundraisingEvents.map(event => (
                <Card key={event.id} className="rounded-2xl sm:rounded-[2rem] overflow-hidden border-none shadow-sm bg-white group hover: transition-all">
                  <div className="h-52 sm:h-64 overflow-hidden relative">
                    <img 
                      src={event.imageUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80"} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 sm:p-8 space-y-5">
                    <h3 className="text-xl sm:text-2xl font-bold">{event.title}</h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs sm:text-sm font-bold">
                        <span className="text-muted-foreground uppercase">Terkumpul</span>
                        <span className="text-primary">{Math.round(((event.collectedAmount || 0) / (event.targetAmount || 1)) * 100)}%</span>
                      </div>
                      <Progress value={((event.collectedAmount || 0) / (event.targetAmount || 1)) * 100} className="h-2.5 sm:h-3 rounded-full" />
                      <div className="flex justify-between items-end pt-1">
                        <p className="text-lg sm:text-xl font-black text-primary">Rp {(event.collectedAmount || 0).toLocaleString('id-ID')}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Target: Rp {(event.targetAmount || 0).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setDonationOpen(true)}
                      className="w-full rounded-2xl min-h-[44px] h-12 font-bold gap-2 text-sm sm:text-base"
                    >
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
          <section className="space-y-8 sm:space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold">Pengurus DKM</h2>
              <p className="text-muted-foreground text-sm sm:text-xl max-w-2xl mx-auto">Kami yang berkhidmat melayani kebutuhan jamaah.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
              {members.sort((a,b) => a.order - b.order).map(member => (
                <div key={member.id} className="text-center space-y-3 group p-2">
                  <div className="w-24 h-24 sm:w-36 sm:h-36 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden border-2 sm:border-4 border-white  group-hover:scale-105 transition-transform duration-300">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                        <User className="h-10 w-10 sm:h-16 sm:w-16 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base sm:text-xl font-bold leading-tight">{member.name}</h3>
                    <p className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-wider">{member.role}</p>
                    {member.bio && <p className="text-xs text-muted-foreground italic line-clamp-2">"{member.bio}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Khutbah Archive */}
        {khutbahArchive.length > 0 && (
          <section className="space-y-8 sm:space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-display font-bold">Arsip Khutbah Jumat</h2>
              <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">Pelajari kembali ringkasan materi khutbah dari khatib kami.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {khutbahArchive.map((sched, idx) => (
                <Card key={idx} className="illustrative-card p-6 sm:p-8 flex flex-col justify-between hover:bg-stone-50 transition-colors border-none shadow-none">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px] px-2.5 font-bold">Khutbah</Badge>
                      <span className="text-xs text-muted-foreground font-semibold italic">{sched.khatibName || "Khatib Masjid"}</span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-display font-bold leading-snug">{sched.khutbahTopic}</h4>
                  </div>
                  <div className="mt-6 pt-5 border-t flex justify-between items-center">
                    <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold hover:bg-primary/5 rounded-xl min-h-[44px]">
                      <FileText className="h-4 w-4" /> Baca Materi
                    </Button>
                    <Button size="icon" variant="secondary" className="rounded-full min-h-[44px] min-w-[44px] shadow-sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Kajian Videos Section */}
        <PublicKajianSection 
          kajianVideos={kajianVideos}
          activeVideo={activeKajianVideo}
          setActiveVideo={setActiveKajianVideo}
        />

        {/* Regular Events Section */}
        <section id="kegiatan" className="space-y-8 sm:space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold">Kegiatan Komunitas</h2>
            <p className="text-muted-foreground text-sm sm:text-xl max-w-2xl mx-auto">Wadah silaturahmi dan menuntut ilmu bagi seluruh jamaah.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {regularEvents.filter(e => e.date > Date.now()).length === 0 ? (
              <div className="col-span-full py-16 sm:py-24 text-center text-muted-foreground italic bg-white rounded-2xl sm:rounded-[3rem] shadow-sm p-6">
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

      {/* Public Donation Dialog with Preset Amounts */}
      <PublicDonationDialog
        open={donationOpen}
        onOpenChange={setDonationOpen}
        tenant={tenant}
        qrisUrl={qrisUrl}
        onDownloadQris={handleDownloadQris}
        onCopyBank={handleCopyBank}
        copied={copied}
      />

      {/* Floating AI Chat Widget */}
      {tenant && (
        <ChatWindow slug={slug!} mosqueName={tenant.name} />
      )}

      {/* Footer */}
      <footer className="border-t py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8 sm:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-display font-bold text-xl sm:text-2xl text-primary">
              <Landmark className="h-7 w-7" />
              <span>MasjidHub</span>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md">
              Membangun peradaban masjid yang mandiri, transparan, dan berdaya melalui digitalisasi yang syar'i.
            </p>
          </div>
          <div className="space-y-4 md:text-right flex flex-col md:items-end">
            <h4 className="text-xl sm:text-2xl font-bold">{tenant.name}</h4>
            <div className="h-px w-20 bg-primary/20" />
            <p className="text-xs sm:text-sm font-medium text-slate-400">© 2026 Ditenagai oleh <span className="text-primary font-bold">MasjidHub.</span></p>
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
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
