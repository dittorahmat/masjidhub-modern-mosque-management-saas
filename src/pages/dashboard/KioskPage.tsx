import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Landmark, Clock, User, Info, WifiOff, Volume2, ShieldAlert } from 'lucide-react';
import { format, addMinutes, isAfter, isBefore, parse } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Tenant, PrayerSchedule } from '@shared/types';
import { cn } from '@/lib/utils';

const PRAYER_NAMES = {
  'fajr': 'Subuh',
  'dhuhr': 'Dzuhur',
  'asr': 'Ashar',
  'maghrib': 'Maghrib',
  'isha': 'Isya'
};

const IQOMAH_MINUTES = {
  'fajr': 12,
  'dhuhr': 10,
  'asr': 10,
  'maghrib': 7,
  'isha': 10
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
    const dayName = format(now, 'eeee', { locale: id }).toLowerCase();
    return schedules.filter(s => s.day === dayName);
  }, [schedules, now]);

  // Logic for Prayer States
  useEffect(() => {
    if (todaySchedules.length === 0) return;

    const currentTimeStr = format(now, 'HH:mm');
    
    // Check for each prayer
    for (const s of todaySchedules) {
      const prayerTime = parse(s.time, 'HH:mm', now);
      const iqomahTime = addMinutes(prayerTime, IQOMAH_MINUTES[s.prayerTime as keyof typeof IQOMAH_MINUTES] || 10);
      const sholatEndTime = addMinutes(iqomahTime, 15); // Silent mode for 15 mins

      if (isAfter(now, prayerTime) && isBefore(now, iqomahTime)) {
        setMode('iqomah');
        setActivePrayer(s.prayerTime);
        const diff = Math.floor((iqomahTime.getTime() - now.getTime()) / 1000);
        setIqomahCountdown(diff > 0 ? diff : 0);
        return;
      } else if (isAfter(now, iqomahTime) && isBefore(now, sholatEndTime)) {
        setMode('sholat');
        setActivePrayer(s.prayerTime);
        return;
      }
    }

    setMode('normal');
    setActivePrayer(null);
  }, [now, todaySchedules]);

  if (mode === 'sholat') {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white animate-in fade-in duration-1000">
        <Landmark className="h-20 w-20 text-stone-800 mb-8" />
        <h1 className="text-4xl font-display font-black tracking-[0.2em] text-stone-500 uppercase">Waktunya Shalat {PRAYER_NAMES[activePrayer as keyof typeof PRAYER_NAMES]}</h1>
        <p className="mt-6 text-stone-600 font-medium italic text-xl">"Luruskan shaf dan matikan alat komunikasi Anda."</p>
        <div className="absolute bottom-10 text-stone-900 text-[10px] uppercase font-bold tracking-widest">Silent Sanctuary Mode Active</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-stone-50 font-sans overflow-hidden flex flex-col p-8 gap-8">
      {/* Top Header */}
      <header className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-stone-100">
        <div className="flex items-center gap-6">
          <div className="bg-emerald-600 p-4 rounded-3xl shadow-lg shadow-emerald-600/20">
            <Landmark className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-black text-stone-800">{tenant?.name || 'MasjidHub'}</h1>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-sm">{tenant?.city || 'Portal Digital'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-7xl font-mono font-black text-emerald-700 tabular-nums">{format(now, 'HH:mm:ss')}</p>
          <p className="text-stone-500 font-bold text-lg mt-1">{format(now, 'EEEE, dd MMMM yyyy', { locale: id })}</p>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-5 gap-6">
        {/* Prayer Grid */}
        {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((pt) => {
          const s = todaySchedules.find(item => item.prayerTime === pt);
          const isActive = activePrayer === pt;
          return (
            <div 
              key={pt} 
              className={cn(
                "rounded-[3rem] p-8 flex flex-col items-center justify-between border transition-all duration-500",
                isActive 
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-2xl scale-105" 
                  : "bg-white border-stone-100 text-stone-800"
              )}
            >
              <p className={cn("text-sm uppercase font-black tracking-widest", isActive ? "text-emerald-100" : "text-stone-400")}>
                {PRAYER_NAMES[pt as keyof typeof PRAYER_NAMES]}
              </p>
              <p className="text-6xl font-mono font-black tabular-nums">{s?.time || '--:--'}</p>
              <div className="text-center">
                <p className={cn("text-[10px] uppercase font-bold", isActive ? "text-emerald-200" : "text-stone-300")}>Imam</p>
                <p className="text-xs font-bold truncate max-w-[120px]">{s?.imamName || '-'}</p>
              </div>
            </div>
          );
        })}
      </main>

      {/* Iqomah Overlay (Conditional) */}
      {mode === 'iqomah' && (
        <div className="absolute inset-0 bg-emerald-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-white z-50 animate-in zoom-in duration-500">
          <div className="bg-white/10 p-10 rounded-full mb-10 border border-white/20">
            <Volume2 className="h-20 w-20 text-white animate-pulse" />
          </div>
          <h2 className="text-5xl font-display font-black mb-4 uppercase tracking-tighter">Iqomah {PRAYER_NAMES[activePrayer as keyof typeof PRAYER_NAMES]}</h2>
          <div className="text-[12rem] font-mono font-black leading-none tabular-nums shadow-emerald-500/50 drop-shadow-2xl">
            {Math.floor(iqomahCountdown / 60)}:{String(iqomahCountdown % 60).padStart(2, '0')}
          </div>
          <p className="text-2xl text-emerald-200 font-medium mt-8 italic">"Sempurnakan wudhu dan bersiap menuju shaf."</p>
        </div>
      )}

      {/* Footer / Running Text */}
      <footer className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex items-center gap-8 overflow-hidden">
        <div className="bg-emerald-500 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shrink-0 shadow-lg shadow-emerald-500/20">Info</div>
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee font-bold text-xl uppercase tracking-wider">
            {tenant?.runningText || "Selamat datang di " + (tenant?.name || 'MasjidHub') + " - Mari makmurkan masjid kita bersama."}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            ✨ Saldo Kas Terakhir: Rp 12.450.000 (Terima kasih atas infaq Anda)
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            🕌 Kajian Rutin Setiap Ahad Ba'da Subuh
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
