import React, { useState } from 'react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Shield, LayoutDashboard, Calendar, Landmark, CheckCircle2, Star, Database, MessageSquare, Smartphone, Lock, Wallet, Users, Zap, Compass, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function LandingPage() {
  // One Live Thing: Simulator Zakat & Estimasi Kas Mandiri
  const [infaqBulanan, setInfaqBulanan] = useState<number>(5000000);
  const alokasiOperasional = Math.round(infaqBulanan * 0.4);
  const alokasiKesejahteraan = Math.round(infaqBulanan * 0.35);
  const alokasiPemberdayaan = Math.round(infaqBulanan * 0.25);

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="py-20 md:py-32 overflow-hidden relative border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 text-stone-600 font-bold text-xs font-medium bg-stone-100 px-3 py-1.5 rounded-md">
              <Compass className="h-3.5 w-3.5 text-emerald-700" />
              <span>Sistem Manajemen Masjid Terbuka</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-black leading-[1.05] tracking-tight text-slate-900">
              Modernisasi Operasional Masjid Nusantara.
            </h1>
            
            <p className="text-xl text-stone-600 leading-relaxed max-w-xl">
              Platform multi-tenant untuk transparansi kas, pencatatan mustahik, jadwal kajian, dan portal publik resmi jamaah.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/register">
                <Button size="lg" className="h-14 px-8 text-base rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white">
                  Daftarkan Masjid <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login?demo=true">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-xl border border-stone-300 font-bold hover:bg-stone-50">
                  Coba Demo Langsung
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* One Live Thing: Simulator Transparansi Kas Masjid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="rounded-3xl border border-stone-200 bg-white p-8 space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="space-y-1">
                <span className="text-xs font-bold font-medium text-stone-500">Live Simulator</span>
                <h3 className="text-xl font-display font-bold text-slate-900">Perhitungan Alokasi Infaq Ummat</h3>
              </div>
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700">
                <Calculator className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-stone-600">Simulasi Infaq Bulanan:</span>
                <span className="font-bold text-slate-900 tabular-nums text-lg">Rp {infaqBulanan.toLocaleString('id-ID')}</span>
              </div>
              <input
                type="range"
                min="1000000"
                max="50000000"
                step="500000"
                value={infaqBulanan}
                aria-label="Simulasi infaq bulanan masjid"
                onChange={(e) => setInfaqBulanan(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
              />
              <div className="flex justify-between text-xs text-stone-600 tabular-nums">
                <span>Rp 1 Jt</span>
                <span>Rp 25 Jt</span>
                <span>Rp 50 Jt</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-100">
                <div>
                  <p className="text-xs font-medium text-stone-500">Operasional & Kebersihan (40%)</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">Rp {alokasiOperasional.toLocaleString('id-ID')}</p>
                </div>
                <span className="text-xs bg-white px-2.5 py-1 rounded border border-stone-200 text-stone-600 font-medium">Rutin</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-100">
                <div>
                  <p className="text-xs font-medium text-stone-500">Santunan Mustahik & Dhuafa (35%)</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">Rp {alokasiKesejahteraan.toLocaleString('id-ID')}</p>
                </div>
                <span className="text-xs bg-white px-2.5 py-1 rounded border border-stone-200 text-stone-600 font-medium">Sosial</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-100">
                <div>
                  <p className="text-xs font-medium text-stone-500">Kajian & Dakwah Jamaah (25%)</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">Rp {alokasiPemberdayaan.toLocaleString('id-ID')}</p>
                </div>
                <span className="text-xs bg-white px-2.5 py-1 rounded border border-stone-200 text-stone-600 font-medium">Dakwah</span>
              </div>
            </div>

            <p className="text-xs text-stone-500 italic pt-1">
              *Tiap masjid dapat mengatur persentase pos anggaran kas secara mandiri melalui modul keuangan.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Highlights Section (Substantive capabilities over invented proof) */}
      <section className="bg-stone-50 border-b border-stone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="Multi-Tenant" label="Subdomain Resmi Per Masjid" />
            <StatItem value="D1 + SQLite" label="Penyimpanan Data Terisolasi" />
            <StatItem value="QRIS Dinamis" label="Infaq Digital Tanpa Rekening Pribadi" />
            <StatItem value="Kiosk Display" label="Mode Layar TV Masjid & Jadwal Shalat" />
          </div>
        </div>
      </section>

      {/* Enhanced Features Grid */}
      <section id="features" className="py-40 bg-[#fdfcfb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-32 space-y-6">
            <nav className="inline-flex items-center gap-2 text-primary font-medium text-xs">
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

      {/* Operational Pillars (Substance over invented testimonials) */}
      <section className="bg-slate-900 py-28 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Tiga Pilar Tata Kelola Modern</h2>
            <p className="text-stone-400 text-lg max-w-2xl mx-auto">Prinsip akuntansi syariah, keterbukaan informasi publik, dan kemudahan akses seluruh jamaah.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
              <div className="text-emerald-400 font-bold text-xs tracking-wider">01 / AKUNTABILITAS KAS</div>
              <h3 className="text-xl font-bold text-white">Pencatatan Multi-Rekening Real-Time</h3>
              <p className="text-stone-300 text-sm leading-relaxed">Setiap transaksi infaq terpisah antara kas operasional, dana yatim, dan kas pembangunan tanpa percampuran saldo.</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
              <div className="text-emerald-400 font-bold text-xs tracking-wider">02 / KEMUDAHAN JAMAAH</div>
              <h3 className="text-xl font-bold text-white">Portal & Kiosk Informasi Terbuka</h3>
              <p className="text-stone-300 text-sm leading-relaxed">Jadwal kajian, display countdown shalat masjid, dan unduhan laporan kas PDF bulanan dapat diakses langsung oleh jamaah.</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
              <div className="text-emerald-400 font-bold text-xs tracking-wider">03 / KEDAULATAN DATA</div>
              <h3 className="text-xl font-bold text-white">Isolasi Multi-Tenant Mandiri</h3>
              <p className="text-stone-300 text-sm leading-relaxed">Database terisolasi per tenant masjid. Data mustahik dan identitas muzakki terjaga kerahasiaannya dengan aman.</p>
            </div>
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
              <div className="absolute -top-5 left-10 bg-primary text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] ">Most Helpful</div>
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
                <Button className="w-full h-20 rounded-full text-xl font-black   bg-primary">Daftar Sekarang</Button>
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
              <Button size="lg" variant="secondary" className="h-20 px-16 text-2xl rounded-full font-black  hover:scale-105 transition-transform text-primary">
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
    <div className="space-y-1.5 text-center">
      <p className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs text-stone-500 font-medium">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="illustrative-card p-12 space-y-8 group transition-all duration-500 border-none shadow-none hover:shadow-none hover:translate-y-0"
    >
      <div className="bg-stone-50 w-20 h-20 rounded-3xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 border-2 border-stone-100/50">
        {icon}
      </div>
      <div className="space-y-4 text-left">
        <h3 className="text-3xl font-display font-black tracking-tight italic text-slate-900 leading-tight">{title}</h3>
        <p className="text-muted-foreground text-lg leading-relaxed font-medium">{description}</p>
      </div>
    </motion.div>
  );
}
