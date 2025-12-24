import React from 'react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Shield, LayoutDashboard, Calendar, Landmark, CheckCircle2, Star } from 'lucide-react';
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
              <Star className="h-4 w-4 fill-emerald-600" /> Platform Pilihan 100+ Masjid di Indonesia
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-bold leading-tight">
              Manajemen <span className="text-primary italic">Rumah Ibadah</span> Modern.
            </h1>
            <p className="text-2xl text-muted-foreground leading-relaxed max-w-xl">
              MasjidHub adalah digital backbone untuk ekosistem masjid. Transparansi keuangan, kemudahan inventaris, dan kedekatan jamaah dalam satu genggaman.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="h-16 px-10 text-xl rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
                  Daftar Masjid Gratis <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link to="/login?demo=true">
                <Button size="lg" variant="outline" className="h-16 px-10 text-xl rounded-2xl border-2 hover:bg-stone-50">
                  Lihat Demo Platform
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
                alt="Komunitas Masjid"
                className="object-cover aspect-[4/3]"
              />
              <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Infaq Jumat Terkumpul</p>
                  <p className="text-3xl font-display font-bold">Rp 12.450.000</p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Stats Ticker */}
      <section className="bg-stone-50 border-y py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem value="150+" label="Masjid Terdaftar" />
            <StatItem value="12k+" label="Jamaah Aktif" />
            <StatItem value="500+" label="Kegiatan Berhasil" />
            <StatItem value="24/7" label="Dukungan Teknis" />
          </div>
        </div>
      </section>
      {/* Features Grid */}
      <section id="features" className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-5xl font-display font-bold">Semua yang Anda butuhkan dalam satu tempat</h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Kami menangani administrasi yang rumit, agar Anda bisa fokus melayani jamaah dan membina ummat.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Shield className="h-12 w-12 text-emerald-600" />}
              title="Transparansi Keuangan"
              description="Pencatatan real-time untuk Infaq, Sodaqoh, dan operasional dengan laporan otomatis yang bisa diakses jamaah."
            />
            <FeatureCard
              icon={<LayoutDashboard className="h-12 w-12 text-emerald-600" />}
              title="Aset & Inventaris"
              description="Pantau kondisi dan jumlah aset masjid secara digital. Pengingat pemeliharaan AC, Sound System, dan Karpet."
            />
            <FeatureCard
              icon={<Calendar className="h-12 w-12 text-emerald-600" />}
              title="Portal Jamaah"
              description="Halaman publik khusus untuk masjid Anda. Informasi kegiatan, jadwal kajian, dan pendaftaran online dalam satu link."
            />
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-primary py-24 text-white overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-8 relative z-10">
          <Landmark className="h-20 w-20 mx-auto opacity-50 mb-8" />
          <h2 className="text-5xl md:text-7xl font-display font-bold">Waktunya Digitalisasi Masjid Anda.</h2>
          <p className="text-2xl text-primary-foreground opacity-90 max-w-2xl mx-auto">
            Bergabunglah dengan ratusan pengurus masjid lainnya yang telah memodernisasi manajemen mereka dengan MasjidHub.
          </p>
          <div className="pt-8">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="h-16 px-12 text-xl rounded-2xl shadow-2xl hover:scale-105 transition-transform">
                Mulai Sekarang - Gratis
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-background/5" />
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
      <div className="bg-emerald-50 w-24 h-24 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-3xl font-display font-bold">{title}</h3>
      <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
      <div className="pt-4">
        <Button variant="link" className="p-0 text-primary font-bold h-auto">Pelajari Selengkapnya →</Button>
      </div>
    </div>
  );
}