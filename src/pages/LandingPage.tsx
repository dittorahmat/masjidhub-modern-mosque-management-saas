import React from 'react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Shield, LayoutDashboard, Calendar, Landmark, CheckCircle2, Star, Database, MessageSquare, Smartphone, Lock, Wallet, Users, Zap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function LandingPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="py-24 md:py-40 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-50/50 rounded-full blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-20 items-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <nav className="flex items-center gap-2 text-primary/60 font-black text-[10px] uppercase tracking-[0.4em]">
              <Sparkles className="h-3 w-3" />
              <span>The Mosque OS</span>
            </nav>
            <h1 className="text-6xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter italic text-slate-900">
              Modernisasi <span className="text-primary underline decoration-stone-200 underline-offset-[16px]">Masjid</span> Untuk Ummat.
            </h1>
            <p className="text-2xl text-muted-foreground leading-relaxed max-w-xl font-medium">
              Portal digital yang aman, transparan, dan terhubung langsung untuk kemaslahatan masjid di seluruh Indonesia.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link to="/register">
                <Button size="lg" className="h-20 px-12 text-xl rounded-full font-black shadow-2xl shadow-primary/30 hover:scale-105 transition-transform bg-primary">
                  Daftar Sekarang <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
              <Link to="/login?demo=true">
                <Button size="lg" variant="outline" className="h-20 px-12 text-xl rounded-full border-2 font-black hover:bg-stone-50 transition-all">
                  Coba Demo
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-[3.5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(5,150,105,0.05)] border-2 border-stone-100">
              <img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000"
                alt="Masjid Community"
                className="object-cover aspect-[4/3]"
              />
              <div className="absolute bottom-10 left-10 right-10 bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-white shadow-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Infaq Terkumpul</p>
                  <p className="text-4xl font-display font-black italic tracking-tighter tabular-nums text-slate-900">Rp 14.250.000</p>
                </div>
                <div className="h-16 w-16 bg-primary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                  <Wallet className="h-8 w-8" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-stone-100/50 border-y-2 border-stone-200/40 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <StatItem value="150+" label="Masjid Terdaftar" />
            <StatItem value="12k+" label="Jamaah Aktif" />
            <StatItem value="Rp 2.4M" label="Total Transaksi" />
            <StatItem value="100%" label="Keamanan Data" />
          </div>
        </div>
      </section>

      {/* Enhanced Features Grid */}
      <section id="features" className="py-40 bg-[#fdfcfb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-32 space-y-6">
            <nav className="inline-flex items-center gap-2 text-primary/60 font-black text-[10px] uppercase tracking-[0.4em]">
              <Zap className="h-3 w-3" />
              <span>Full Stack Ecosystem</span>
            </nav>
            <h2 className="text-6xl md:text-7xl font-display font-black tracking-tighter italic text-slate-900">Ekosistem <span className="text-primary">Terlengkap.</span></h2>
            <p className="text-muted-foreground text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
              Satu platform untuk ribuan masjid. Keamanan dan kenyamanan dalam mengelola kegiatan serta keuangan.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureCard
              icon={<Wallet className="h-8 w-8 text-emerald-600" />}
              title="ZIS Per-Masjid"
              description="Laporan zakat, infaq, dan shadaqah real-time untuk transparansi lokal yang tak tertandingi."
            />
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8 text-emerald-600" />}
              title="Forum & Chat"
              description="Ruang diskusi khusus jamaah masjid Anda dengan moderasi internal berbasis adab."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-emerald-600" />}
              title="RBAC Roles"
              description="Izin akses detail untuk DKM, Amil, Ustadz, dan Jamaah. Kendali penuh di tangan admin."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-8 w-8 text-emerald-600" />}
              title="Approval Workflow"
              description="Verifikasi identitas masjid oleh Super Admin untuk menjamin keamanan pengelola."
            />
            <FeatureCard
              icon={<Smartphone className="h-8 w-8 text-emerald-600" />}
              title="PWA Mobile-Ready"
              description="Akses dashboard dan forum tanpa perlu instalasi rumit. Ringan, cepat, dan modern."
            />
            <FeatureCard
              icon={<Database className="h-8 w-8 text-emerald-600" />}
              title="Kriptografi Data"
              description="Setiap data masjid terjaga secara kriptografis. Privasi jamaah terlindungi sempurna."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-900 py-40 text-white relative overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] opacity-50"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-32">
            <h2 className="text-6xl md:text-7xl font-display font-black tracking-tighter italic">Suara <span className="text-emerald-400">Pengurus.</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <TestimonialCard
              quote="MasjidHub memudahkan kami melaporkan infaq harian ke jamaah secara transparan. Kepercayaan meningkat pesat."
              author="H. Ahmad Syarif"
              role="Ketua DKM Masjid Al-Hikmah"
            />
            <TestimonialCard
              quote="Fitur inventarisnya sangat membantu. Kami tidak pernah lagi lupa jadwal pemeliharaan sound system."
              author="Ustadz Mansyur"
              role="Sekretaris Masjid An-Nur"
            />
            <TestimonialCard
              quote="Sebagai amil, modul ZIS sangat membantu pencatatan zakat fitrah. Data tersusun rapi dan sangat aman."
              author="Bpk. Ridwan"
              role="Amil Zakat Masjid Jami"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-24 space-y-6">
            <h2 className="text-6xl md:text-7xl font-display font-black tracking-tighter italic">Pilihan <span className="text-primary">Paket.</span></h2>
            <p className="text-muted-foreground text-2xl font-medium">Bangun kehadiran digital masjid Anda tanpa batasan biaya.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <motion.div whileHover={{ y: -10 }} className="illustrative-card p-12 border-primary border-4 relative text-left hover:shadow-none hover:translate-y-0">
              <div className="absolute -top-5 left-10 bg-primary text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">Most Helpful</div>
              <h3 className="text-4xl font-display font-black mb-4 tracking-tight italic text-slate-900">Free Tier</h3>
              <p className="text-muted-foreground text-lg mb-8 font-medium italic leading-relaxed">Sempurna untuk masjid yang baru memulai perjalanan digitalisasi.</p>
              <div className="text-6xl font-display font-black mb-12 tracking-tighter text-slate-900">Rp 0 <span className="text-lg font-black text-stone-300 uppercase tracking-widest ml-2">Legacy</span></div>
              <ul className="space-y-5 mb-12">
                <li className="flex items-center gap-4 text-base font-bold text-slate-700"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Manajemen Keuangan</li>
                <li className="flex items-center gap-4 text-base font-bold text-slate-700"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Modul ZIS Dasar</li>
                <li className="flex items-center gap-4 text-base font-bold text-slate-700"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Portal Publik Masjid</li>
                <li className="flex items-center gap-4 text-base font-bold text-slate-700"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Forum Ummat</li>
              </ul>
              <Link to="/register" className="block">
                <Button className="w-full h-20 rounded-full text-xl font-black shadow-2xl shadow-primary/20 bg-primary">Daftar Sekarang</Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -10 }} className="illustrative-card p-12 opacity-80 text-left border-dashed hover:shadow-none hover:translate-y-0">
              <h3 className="text-4xl font-display font-black mb-4 tracking-tight italic text-stone-400">Pro Tier</h3>
              <p className="text-stone-400 text-lg mb-8 font-medium italic leading-relaxed">Segera Hadir: Fitur premium untuk skala luas dan integrasi penuh.</p>
              <div className="text-6xl font-display font-black mb-12 tracking-tighter text-stone-300 italic">Coming Soon</div>
              <ul className="space-y-5 mb-12 opacity-40">
                <li className="flex items-center gap-4 text-base font-bold"><CheckCircle2 className="h-5 w-5" /> Custom Domain (masjid-anda.com)</li>
                <li className="flex items-center gap-4 text-base font-bold"><CheckCircle2 className="h-5 w-5" /> Analytics Jamaah Mendalam</li>
                <li className="flex items-center gap-4 text-base font-bold"><CheckCircle2 className="h-5 w-5" /> Integrasi Payment Gateway</li>
                <li className="flex items-center gap-4 text-base font-bold"><CheckCircle2 className="h-5 w-5" /> White-label Management</li>
              </ul>
              <Button variant="outline" className="w-full h-20 rounded-full text-xl font-black border-2 border-stone-200 text-stone-300" disabled>Nantikan Update</Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-primary py-32 text-white overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-12 relative z-10">
          <Landmark className="h-24 w-24 mx-auto opacity-30 mb-8" />
          <h2 className="text-7xl md:text-9xl font-display font-black tracking-tighter italic">Siap <span className="text-emerald-300 underline decoration-white/20 underline-offset-[20px]">Memulai?</span></h2>
          <p className="text-3xl text-primary-foreground opacity-90 max-w-2xl mx-auto font-medium leading-relaxed">
            Hanya butuh 2 menit untuk membuat portal masjid modern Anda hari ini.
          </p>
          <div className="flex flex-wrap justify-center gap-8 pt-12">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="h-20 px-16 text-2xl rounded-full font-black shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform text-primary">
                Mulai Gratis
              </Button>
            </Link>
            <Link to="/login?demo=true">
              <Button size="lg" variant="outline" className="h-20 px-16 text-2xl rounded-full border-4 bg-transparent text-white hover:bg-white/10 font-black">
                Lihat Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="space-y-2 text-center">
      <p className="text-6xl font-display font-black text-primary tracking-tighter italic leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="illustrative-card p-12 space-y-8 group transition-all duration-500 border-none shadow-none hover:shadow-none hover:translate-y-0"
    >
      <div className="bg-stone-50 w-20 h-20 rounded-3xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-sm border-2 border-stone-100/50">
        {icon}
      </div>
      <div className="space-y-4 text-left">
        <h3 className="text-3xl font-display font-black tracking-tight italic text-slate-900 leading-tight">{title}</h3>
        <p className="text-muted-foreground text-lg leading-relaxed font-medium">{description}</p>
      </div>
    </motion.div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <div className="bg-white/5 border-2 border-white/10 p-12 rounded-[3.5rem] space-y-8 backdrop-blur-md hover:bg-white/10 transition-colors duration-500">
      <Star className="h-10 w-10 text-amber-400 fill-amber-400" />
      <p className="text-2xl italic font-display font-bold leading-relaxed text-emerald-50">"{quote}"</p>
      <div className="pt-8 border-t border-white/10 text-left">
        <p className="font-black text-xl tracking-tight italic">{author}</p>
        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{role}</p>
      </div>
    </div>
  );
}
