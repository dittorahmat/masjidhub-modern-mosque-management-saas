import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Landmark, Clock, User, Info, WifiOff, Volume2, ShieldAlert, Heart, TrendingUp, Sparkles } from 'lucide-react';
import { format, addMinutes, isAfter, isBefore, parse } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Tenant, PrayerSchedule } from '@shared/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const PRAYER_NAMES = {
  'fajr': 'Subuh',
  'dhuhr': 'Dzuhur',
  'asr': 'Ashar',
  'maghrib': 'Maghrib',
  'isha': 'Isya'
};

const DEFAULT_IQOMAH = {
  fajr: 12, dhuhr: 10, asr: 10, maghrib: 7, isha: 10
};

export default function KioskPage() {
  const { slug } = useParams();
  const [now, setNow] = useState(new Date());
  const [mode, setMode] = useState<'normal' | 'iqomah' | 'sholat'>('normal');
  const [activePrayer, setActivePrayer] = useState<string | null>(null);
  const [iqomahCountdown, setIqomahCountdown] = useState(0);

  const { data: tenant } = useQuery({
    queryKey: ['tenants', slug],
    queryFn: () => api<Tenant>(`/api/tenants/${slug}`)
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['prayer-schedules', slug],
    queryFn: () => api<PrayerSchedule[]>(`/api/${slug}/prayer-schedules`)
  });

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's Schedules Memo
  const todaySchedules = useMemo(() => {
    const todayStr = format(now, 'yyyy-MM-dd');
    const dayName = format(now, 'eeee', { locale: id }).toLowerCase();
    const daily = schedules.filter(s => s.date === todayStr);
    if (daily.length > 0) return daily;
    return schedules.filter(s => s.day === dayName && !s.date);
  }, [schedules, now]);

  // Logic for Prayer States
  useEffect(() => {
    if (todaySchedules.length === 0) return;
    const iqomahSettings = tenant?.iqomahMinutes || DEFAULT_IQOMAH;
    for (const s of todaySchedules) {
      const prayerTime = parse(s.time, 'HH:mm', now);
      const iqomahMinutes = iqomahSettings[s.prayerTime as keyof typeof DEFAULT_IQOMAH] || 10;
      const iqomahTime = addMinutes(prayerTime, iqomahMinutes);
      const sholatDuration = tenant?.sholatDuration || 15;
      const sholatEndTime = addMinutes(iqomahTime, sholatDuration);

      if (isAfter(now, prayerTime) && isBefore(now, iqomahTime)) {
        setMode('iqomah');
        setActivePrayer(s.prayerTime);
        const diff = Math.floor((iqomahTime.getTime() - now.getTime()) / 1000);
        setIqomahCountdown(diff > 0 ? diff : 0);
        return;
      } else if (isAfter(now, iqomahTime) && isBefore(now, sholatEndTime)) {
        if (tenant?.kioskPrayerMode === 'clock') {
          setMode('normal');
          setActivePrayer(s.prayerTime);
        } else {
          setMode('sholat');
          setActivePrayer(s.prayerTime);
        }
        return;
      }
    }
    setMode('normal');
    setActivePrayer(null);
  }, [now, todaySchedules, tenant]);

  if (mode === 'sholat') {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden relative">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)]"
        />
        <Landmark className="h-24 w-24 text-emerald-500 mb-12 relative z-10" />
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-6xl font-display font-black tracking-[0.3em] text-white uppercase relative z-10"
        >
          WAKTUNYA SHALAT {PRAYER_NAMES[activePrayer as keyof typeof PRAYER_NAMES]}
        </motion.h1>
        <p className="mt-8 text-emerald-200/60 font-display italic text-3xl relative z-10">"Luruskan shaf dan matikan alat komunikasi Anda."</p>
        <div className="absolute bottom-12 text-slate-700 text-xs uppercase font-black tracking-[0.5em]">Silent Sanctuary Active</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#fdfcfb] font-sans overflow-hidden flex flex-col p-10 gap-10">
      {/* Dynamic Background Element */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-50/50 rounded-full blur-[120px] -z-10" />
      
      {/* Top Header */}
      <header className="flex justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-[10px_10px_0px_0px_rgba(0,0,0,0.03)] border-2 border-stone-100">
        <div className="flex items-center gap-8">
          <div className="bg-emerald-600 p-6 rounded-[2rem] shadow-2xl shadow-emerald-600/30">
            <Landmark className="h-12 w-12 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter italic">{tenant?.name || 'MasjidHub'}</h1>
            <div className="flex items-center gap-2 text-stone-400 font-black uppercase tracking-[0.3em] text-xs">
               <Sparkles className="h-3 w-3 text-emerald-500" />
               <span>{tenant?.city || 'Portal Digital'}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-8xl font-mono font-black text-emerald-700 tabular-nums leading-none tracking-tighter">{format(now, 'HH:mm:ss')}</p>
          <div className="flex items-center gap-3 mt-4 text-stone-500 font-bold text-2xl italic">
             <div className="w-8 h-[2px] bg-stone-200" />
             {format(now, 'EEEE, dd MMMM yyyy', { locale: id })}
          </div>
        </div>
      </header>

      {/* Prayer Schedule Tiles */}
      <main className="flex-1 grid grid-cols-5 gap-8">
        {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((pt, idx) => {
          const s = todaySchedules.find(item => item.prayerTime === pt);
          const isActive = activePrayer === pt;
          return (
            <motion.div 
              key={pt}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.8 }}
              className={cn(
                "rounded-[3.5rem] p-10 flex flex-col items-center justify-between border-2 transition-all duration-700", 
                isActive 
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-[20px_20px_0px_0px_rgba(16,185,129,0.15)] scale-[1.02]" 
                  : "bg-white border-stone-100 text-slate-800 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.02)]"
              )}
            >
              <div className="space-y-2 text-center">
                 <p className={cn("text-xs uppercase font-black tracking-[0.3em]", isActive ? "text-emerald-100" : "text-stone-400")}>{PRAYER_NAMES[pt as keyof typeof PRAYER_NAMES]}</p>
                 <div className={cn("h-1 w-8 mx-auto rounded-full", isActive ? "bg-white/30" : "bg-stone-100")} />
              </div>
              <p className="text-7xl md:text-8xl font-mono font-black tabular-nums tracking-tighter leading-none">{s?.time || '--:--'}</p>
              <div className="text-center space-y-1">
                <p className={cn("text-[10px] uppercase font-black tracking-widest", isActive ? "text-emerald-200" : "text-stone-300")}>Imam Rawatib</p>
                <p className="text-sm font-black italic truncate max-w-[160px]">{s?.imamName || '—'}</p>
              </div>
            </motion.div>
          );
        })}
      </main>

      {/* Middle Ribbon: Financial Transparency & Info */}
      <section className="grid grid-cols-3 gap-8">
         <div className="col-span-2 bg-slate-900 text-white p-8 rounded-[3rem] flex items-center justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex items-center gap-6 relative z-10">
               <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="h-8 w-8 text-slate-900" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Transparansi Keuangan Minggu Ini</p>
                  <h3 className="text-3xl font-display font-black italic">Infaq Terkumpul: <span className="text-emerald-400 text-4xl tabular-nums">Rp 14.250.000</span></h3>
               </div>
            </div>
            <div className="text-right hidden md:block relative z-10">
               <p className="text-xs font-bold text-slate-400">Terimakasih atas kedermawanan Anda.</p>
               <p className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest mt-1">#MasjidTransparan</p>
            </div>
         </div>
         <div className="bg-white border-2 border-stone-100 p-8 rounded-[3rem] flex items-center gap-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.03)]">
            <div className="p-4 bg-stone-100 rounded-2xl">
               <Heart className="h-8 w-8 text-primary" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Butuh Bantuan?</p>
               <h3 className="text-xl font-display font-black italic">Amil Zakat Siaga</h3>
               <p className="text-xs font-bold text-stone-400">Hubungi: 0812-3456-7890</p>
            </div>
         </div>
      </section>

      {/* Footer / Running Text */}
      <footer className="bg-white border-2 border-stone-100 p-6 rounded-[2.5rem] flex items-center gap-8 overflow-hidden shadow-sm">
        <div className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shrink-0 shadow-lg">Warta Jumaat</div>
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee font-black text-2xl text-slate-800 italic tracking-tight uppercase">
            {tenant?.kioskRunningText || tenant?.runningText || "Selamat datang di " + (tenant?.name || 'MasjidHub')}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            🕌 Mari makmurkan masjid kita bersama demi keberkahan ummat.
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            ✨ Update Kajian Ahad Subuh: "Fiqh Muamalah Modern" bersama Ustadz Dr. Ahmad Hidayat.
          </div>
        </div>
      </footer>

      {/* Iqomah Overlay */}
      <AnimatePresence>
        {mode === 'iqomah' && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-emerald-950/98 backdrop-blur-2xl flex flex-col items-center justify-center text-white z-50 p-20"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]"
            />
            <div className="bg-white/10 p-12 rounded-full mb-12 border border-white/20 relative z-10 shadow-2xl">
               <Volume2 className="h-24 w-24 text-white animate-pulse" />
            </div>
            <h2 className="text-6xl font-display font-black mb-6 uppercase tracking-tighter italic text-emerald-400 relative z-10">Iqomah {PRAYER_NAMES[activePrayer as keyof typeof PRAYER_NAMES]}</h2>
            <div className="text-[18rem] font-mono font-black leading-none tabular-nums shadow-emerald-500/50 drop-shadow-[0_35px_35px_rgba(16,185,129,0.3)] relative z-10">
               {Math.floor(iqomahCountdown / 60)}:{String(iqomahCountdown % 60).padStart(2, '0')}
            </div>
            <p className="text-3xl text-emerald-200/60 font-display font-medium mt-12 italic relative z-10 max-w-3xl text-center leading-relaxed">
               "Sempurnakan wudhu dan bersiaplah menghadap Sang Khaliq dalam kekhusyu'an."
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(50%); } 100% { transform: translateX(-150%); } }
        .animate-marquee { animation: marquee 40s linear infinite; }
      `}</style>
    </div>
  );
}
