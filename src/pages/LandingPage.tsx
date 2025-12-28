import React from 'react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Shield, LayoutDashboard, Calendar, Landmark, CheckCircle2, Star, Database, MessageSquare, Smartphone, Lock, Wallet, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
export function LandingPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="py-20 md:py-32 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(5,150,105,0.05)_0%,transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center relative">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-bold text-sm">
              <Zap className="h-4 w-4 fill-emerald-600 animate-pulse" /> Platform SaaS Multi-Tenant untuk Masjid
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
              Digitalisasi Masjid untuk <span className="text-primary italic">Kemaslahatan</span> Ummat.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              Modernisasi tata kelola masjid untuk kemaslahatan ummat. Setiap masjid memiliki portal unik yang aman, transparan, dan terhubung langsung dengan jamaah.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="h-16 px-10 text-xl rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
                  Daftar Masjid Gratis <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link to="/login?demo=true">
                <Button size="lg" variant="outline" className="h-16 px-10 text-xl rounded-2xl border-2 hover:bg-stone-50">
                  Coba Demo Sekarang
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-square bg-emerald-100 rounded-[3rem] blur-3xl absolute -z-10 w-full opacity-40 animate-pulse" />
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] border-8 border-white">
              <img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000"
                alt="Masjid Community"
                className="object-cover aspect-[4/3]"
              />
              <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Infaq Jumat Terkumpul</p>
                  <p className="text-3xl font-display font-bold">Rp 12.450.000</p>
                </div>
                <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="bg-stone-50 border-y py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem value="150+" label="Masjid Terdaftar" />
            <StatItem value="12k+" label="Jamaah Aktif" />
            <StatItem value="Rp 2.4M" label="Total Transaksi" />
            <StatItem value="100%" label="Keamanan Data" />
          </div>
        </div>
      </section>
      {/* Enhanced Features Grid */}
      <section id="features" className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-5xl font-display font-bold">Ekosistem Digital Masjid Terlengkap</h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Satu platform, ribuan masjid. Setiap masjid mendapatkan keamanan dan kenyamanan dalam mengelola kegiatan dan keuangan.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Wallet className="h-10 w-10 text-emerald-600" />}
              title="ZIS Per-Masjid"
              description="Rekening langsung ke bank masjid. Laporan zakat, infaq, dan shadaqah real-time untuk transparansi lokal."
            />
            <FeatureCard
              icon={<MessageSquare className="h-10 w-10 text-emerald-600" />}
              title="Forum & Chat"
              description="Ruang diskusi khusus jamaah masjid Anda. Moderasi internal untuk menjaga adab dan kenyamanan komunitas."
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-emerald-600" />}
              title="RBAC Roles"
              description="Izin akses detail untuk DKM, Amil, Ustadz, dan Jamaah. Kendali penuh di tangan admin masjid."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-10 w-10 text-emerald-600" />}
              title="Approval Workflow"
              description="Verifikasi identitas masjid oleh Super Admin untuk menjamin keamanan dan keaslian setiap pengelola."
            />
            <FeatureCard
              icon={<Smartphone className="h-10 w-10 text-emerald-600" />}
              title="PWA Mobile-Ready"
              description="Akses dashboard dan forum seperti aplikasi mobile. Ringan, cepat, dan tanpa perlu instalasi rumit."
            />
            <FeatureCard
              icon={<Database className="h-10 w-10 text-emerald-600" />}
              title="Keamanan Data Terjamin"
              description="Setiap data masjid terjaga secara kriptografis. Privasi jamaah dan keuangan terlindungi sempurna."
            />
          </div>
        </div>
      </section>
      {/* Testimonials */}
      <section className="bg-emerald-900 py-32 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-display font-bold">Dipercaya Oleh Pengurus Masjid</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="MasjidHub memudahkan kami melaporkan infaq harian ke jamaah secara transparan. Kepercayaan jamaah meningkat pesat."
              author="H. Ahmad Syarif"
              role="Ketua DKM Masjid Al-Hikmah"
            />
            <TestimonialCard
              quote="Fitur inventarisnya sangat membantu. Kami tidak pernah lagi lupa jadwal pemeliharaan sound system dan AC."
              author="Ustadz Mansyur"
              role="Sekretaris Masjid An-Nur"
            />
            <TestimonialCard
              quote="Sebagai amil, modul ZIS sangat membantu pencatatan zakat fitrah saat Ramadan. Data tersusun rapi dan aman."
              author="Bpk. Ridwan"
              role="Amil Zakat Masjid Jami"
            />
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-16">
            <h2 className="text-5xl font-display font-bold mb-4">Pilihan Paket</h2>
            <p className="text-muted-foreground text-xl">Bangun kehadiran digital masjid Anda tanpa batasan.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="illustrative-card p-10 border-primary border-2 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase">Populer</div>
              <h3 className="text-3xl font-display font-bold mb-2">Free Tier</h3>
              <p className="text-muted-foreground mb-6">Untuk masjid yang baru memulai digitalisasi.</p>
              <div className="text-4xl font-bold mb-8">Rp 0 <span className="text-sm font-normal text-muted-foreground">/selamanya</span></div>
              <ul className="text-left space-y-4 mb-10">
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> Manajemen Keuangan & Infaq</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> Modul ZIS Dasar</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> Portal Publik (masjidhub.com/app/slug)</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> Forum Ummat</li>
              </ul>
              <Link to="/register" className="block">
                <Button className="w-full h-12 rounded-xl text-lg">Daftar Sekarang</Button>
              </Link>
            </div>
            <div className="illustrative-card p-10 opacity-75">
              <h3 className="text-3xl font-display font-bold mb-2">Pro Tier</h3>
              <p className="text-muted-foreground mb-6">Segera Hadir: Fitur premium untuk skala luas.</p>
              <div className="text-4xl font-bold mb-8">Coming <span className="text-sm font-normal text-muted-foreground">Soon</span></div>
              <ul className="text-left space-y-4 mb-10">
                <li className="flex items-center gap-2 text-sm opacity-50"><CheckCircle2 className="h-4 w-4" /> Custom Domain (masjid-anda.com)</li>
                <li className="flex items-center gap-2 text-sm opacity-50"><CheckCircle2 className="h-4 w-4" /> Analytics Jamaah Mendalam</li>
                <li className="flex items-center gap-2 text-sm opacity-50"><CheckCircle2 className="h-4 w-4" /> Integrasi Payment Gateway Otomatis</li>
                <li className="flex items-center gap-2 text-sm opacity-50"><CheckCircle2 className="h-4 w-4" /> Branding Tanpa Logo MasjidHub</li>
              </ul>
              <Button variant="outline" className="w-full h-12 rounded-xl text-lg" disabled>Hubungi Kami</Button>
            </div>
          </div>
        </div>
      </section>
      {/* Final CTA Section */}
      <section className="bg-primary py-24 text-white overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-8 relative z-10">
          <Landmark className="h-20 w-20 mx-auto opacity-50 mb-8" />
          <h2 className="text-5xl md:text-7xl font-display font-bold">Siap Mengudara Sekarang?</h2>
          <p className="text-2xl text-primary-foreground opacity-90 max-w-2xl mx-auto">
            Bergabunglah dengan ratusan pengurus masjid lainnya. Hanya butuh 2 menit untuk membuat portal masjid Anda.
          </p>
          <div className="flex flex-wrap justify-center gap-6 pt-8">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="h-16 px-12 text-xl rounded-2xl shadow-2xl hover:scale-105 transition-transform">
                Mulai Gratis
              </Button>
            </Link>
            <Link to="/login?demo=true">
              <Button size="lg" variant="outline" className="h-16 px-12 text-xl rounded-2xl border-2 bg-transparent text-white hover:bg-white/10">
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
    <div className="space-y-1">
      <p className="text-4xl font-display font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="illustrative-card p-10 space-y-6 group hover:border-primary transition-all duration-300">
      <div className="bg-emerald-50 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold">{title}</h3>
      <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
    </div>
  );
}
function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] space-y-6 backdrop-blur-sm">
      <Star className="h-8 w-8 text-amber-400 fill-amber-400" />
      <p className="text-xl italic font-display leading-relaxed">"{quote}"</p>
      <div className="pt-6 border-t border-white/10">
        <p className="font-bold text-lg">{author}</p>
        <p className="text-emerald-400 text-sm">{role}</p>
      </div>
    </div>
  );
}