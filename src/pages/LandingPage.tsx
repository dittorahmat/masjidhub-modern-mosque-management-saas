import React from 'react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Shield, LayoutDashboard, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
export function LandingPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
              Manajemen Modern untuk <span className="text-primary italic">Rumah Ibadah Anda.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              MasjidHub adalah tulang punggung digital bagi masjid. Kelola keuangan, inventaris, dan kegiatan jamaah dengan mudah dan transparan.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-xl">
                  Mulai Digitalisasi Masjid <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/app/al-hikmah/dashboard">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-xl">
                  Lihat Demo
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative animate-gentle-bounce">
            <div className="aspect-square bg-emerald-100 rounded-full blur-3xl absolute -z-10 w-full opacity-50" />
            <img
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000"
              alt="Komunitas Masjid"
              className="rounded-3xl shadow-2xl border-4 border-white object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </section>
      {/* Features Grid */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-display font-bold">Semua yang Anda butuhkan dalam satu tempat</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Kami fokus pada administrasi, agar Anda bisa fokus pada jamaah.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-emerald-600" />}
              title="Pelacakan Keuangan"
              description="Pencatatan transparan untuk Infaq, Sadaqoh, dan biaya operasional masjid."
            />
            <FeatureCard
              icon={<LayoutDashboard className="h-10 w-10 text-emerald-600" />}
              title="Manajemen Inventaris"
              description="Pantau aset masjid mulai dari karpet hingga sistem pengeras suara."
            />
            <FeatureCard
              icon={<Calendar className="h-10 w-10 text-emerald-600" />}
              title="Portal Kegiatan"
              description="Buat kegiatan dan biarkan jamaah Anda mendaftar secara online dengan mudah."
            />
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="illustrative-card p-8 space-y-4">
      <div className="bg-emerald-50 w-20 h-20 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}