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
              Modern Management for <span className="text-primary italic">Your Sacred Space.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              MasjidHub is the digital backbone for mosques. Manage finance, inventory, and community events with ease and transparency.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-xl">
                  Start Your Mosque <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-xl">
                View Demo
              </Button>
            </div>
          </div>
          <div className="relative animate-gentle-bounce">
            <div className="aspect-square bg-emerald-100 rounded-full blur-3xl absolute -z-10 w-full opacity-50" />
            <img 
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000" 
              alt="Community" 
              className="rounded-3xl shadow-2xl border-4 border-white object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </section>
      {/* Features Grid */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-display font-bold">Everything you need in one place</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We focus on the admin, so you can focus on the congregation.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="h-10 w-10 text-emerald-600" />}
              title="Finance Tracking"
              description="Transparent record keeping for Infaq, Sadaqoh, and operational expenses."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="h-10 w-10 text-emerald-600" />}
              title="Inventory Management"
              description="Keep track of mosque assets, from carpets to sound systems."
            />
            <FeatureCard 
              icon={<Calendar className="h-10 w-10 text-emerald-600" />}
              title="Event Portal"
              description="Create events and let your Jamaah register online effortlessly."
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