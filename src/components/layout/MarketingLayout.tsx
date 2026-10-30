import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Landmark, Menu, X, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0 min-h-[44px]">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Landmark className="h-5 w-5" />
            </div>
            <span className="text-xl font-display font-bold text-foreground tracking-tight">MasjidHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="font-semibold text-slate-700 min-h-[44px] px-5 rounded-full">
                Masuk
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold min-h-[44px] px-6 rounded-full shadow-sm hover:shadow transition-all">
                Daftar Masjid
              </Button>
            </Link>
          </nav>

          {/* Mobile Navigation Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/login" className="inline-flex">
              <Button variant="ghost" size="sm" className="min-h-[44px] px-3 font-semibold text-xs text-primary">
                Masuk
              </Button>
            </Link>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="min-h-[44px] min-w-[44px] rounded-xl border-stone-200"
                  aria-label="Buka Menu"
                >
                  <Menu className="h-5 w-5 text-slate-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <SheetHeader className="text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <SheetTitle className="text-lg font-display font-bold">MasjidHub</SheetTitle>
                    </div>
                    <p className="text-xs text-muted-foreground">Digitalisasi ekosistem masjid modern Indonesia.</p>
                  </SheetHeader>

                  <div className="pt-4 border-t space-y-3">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-1">Menu Akses</p>
                    <div className="flex flex-col gap-2">
                      <Link 
                        to="/login?demo=true" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 min-h-[44px] font-semibold text-sm text-slate-800 transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Coba Demo Interaktif
                        </span>
                        <ArrowRight className="h-4 w-4 text-stone-400" />
                      </Link>
                      <Link 
                        to="/portal/al-hikmah" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 min-h-[44px] font-semibold text-sm text-slate-800 transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <HeartHandshake className="h-4 w-4 text-primary" /> Contoh Portal Publik
                        </span>
                        <ArrowRight className="h-4 w-4 text-stone-400" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t">
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white min-h-[48px] rounded-xl font-bold shadow-md">
                      Daftar Masjid Gratis
                    </Button>
                  </Link>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full min-h-[44px] rounded-xl font-semibold border-stone-200">
                      Login Pengurus DKM
                    </Button>
                  </Link>
                  <p className="text-[11px] text-center text-muted-foreground pt-2">
                    © 2026 Digitalisasi Ummat Indonesia.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-stone-100 border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p className="font-display font-bold text-lg text-foreground mb-2">MasjidHub</p>
          <p>© 2026 Digitalisasi Ummat. Dibangun untuk komunitas.</p>
        </div>
      </footer>
    </div>
  );
}
