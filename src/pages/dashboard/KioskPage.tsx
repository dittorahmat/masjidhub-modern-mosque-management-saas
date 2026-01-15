import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark, Clock, Calendar, Volume2, Wallet, Info } from 'lucide-react';
import type { Tenant, PrayerSchedule, Transaction } from '@shared/types';

export default function KioskPage() {
  const { slug } = useParams();
  const [now, setNow] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: tenant } = useQuery({
    queryKey: ['tenants', slug],
    queryFn: () => api<Tenant>(`/api/tenants/${slug}`)
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['prayer-schedules', slug],
    queryFn: () => api<PrayerSchedule[]>(`/api/${slug}/prayer-schedules`)
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', slug],
    queryFn: () => api<Transaction[]>(`/api/${slug}/transactions`)
  });

  const totalBalance = transactions.reduce((acc, curr) => 
    curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0
  );

  if (!tenant) return <div className="h-screen bg-black text-white flex items-center justify-center">Memuat Kiosk...</div>;

  return (
    <div className="h-screen bg-slate-950 text-white overflow-hidden flex flex-col p-6 space-y-6">
      {/* Header Area */}
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary/20 rounded-2xl">
            <Landmark className="h-16 w-16 text-primary" />
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight">{tenant.name}</h1>
            <p className="text-2xl text-slate-400 mt-1">{tenant.address || 'Selamat Datang'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-7xl font-mono font-bold text-primary tabular-nums">
            {format(now, 'HH:mm:ss')}
          </div>
          <div className="text-2xl text-slate-400 mt-2 font-medium">
            {format(now, 'EEEE, d MMMM yyyy', { locale: id })}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Column: Prayer Times */}
        <div className="col-span-4 flex flex-col space-y-4">
          <h2 className="text-3xl font-bold px-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" /> Jadwal Shalat
          </h2>
          <div className="flex-1 space-y-4">
            {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => {
              const sched = schedules.find(s => s.prayerTime === p);
              return (
                <div key={p} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex justify-between items-center group hover:bg-primary/10 transition-colors">
                  <span className="text-3xl font-bold capitalize">{p === 'fajr' ? 'Subuh' : p === 'dhuhr' ? 'Dzuhur' : p === 'asr' ? 'Ashar' : p === 'maghrib' ? 'Maghrib' : 'Isya'}</span>
                  <span className="text-5xl font-mono font-bold text-primary">{sched?.time || '--:--'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Info & Announcements */}
        <div className="col-span-5 flex flex-col space-y-6">
          <Card className="flex-1 bg-slate-900 border-slate-800 p-8 flex flex-col items-center justify-center text-center space-y-8 rounded-[3rem]">
            <div className="p-8 bg-primary/10 rounded-full animate-pulse">
              <Volume2 className="h-24 w-24 text-primary" />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-bold">Pengumuman</h3>
              <p className="text-3xl text-slate-300 leading-relaxed">
                {tenant.runningText || "Mari jaga kebersihan masjid dan matikan alat komunikasi saat ibadah."}
              </p>
            </div>
          </Card>
          
          <div className="bg-emerald-950/30 border border-emerald-500/30 p-8 rounded-3xl flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Wallet className="h-12 w-12 text-emerald-400" />
              <div>
                <p className="text-xl text-emerald-400 font-bold uppercase tracking-wider">Saldo Kas Masjid</p>
                <p className="text-5xl font-bold">Rp {totalBalance.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <Badge className="bg-emerald-500 text-black text-xl px-4 py-2 font-bold uppercase">Transparan</Badge>
          </div>
        </div>

        {/* Right Column: QRIS Infaq */}
        <div className="col-span-3 flex flex-col space-y-6">
          <Card className="flex-1 bg-white p-8 flex flex-col items-center justify-between rounded-[3rem]">
             <div className="text-center">
               <h4 className="text-slate-900 text-3xl font-black uppercase mb-2 italic">Infaq Digital</h4>
               <p className="text-slate-500 text-lg font-bold uppercase">Scan untuk Sedekah</p>
             </div>
             <div className="w-full aspect-square bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden p-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=MasjidHub-Infaq-${slug}`} 
                  alt="QRIS Infaq"
                  className="w-full h-full object-contain"
                />
             </div>
             <div className="text-center w-full">
               <div className="bg-slate-900 text-white py-4 px-6 rounded-2xl">
                 <p className="text-lg font-mono break-all">{tenant.bankInfo || 'Bank Syariah Indonesia'}</p>
               </div>
             </div>
          </Card>
        </div>
      </div>

      {/* Footer / Ticker Area */}
      <div className="bg-primary p-4 -mx-6 -mb-6 flex items-center overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee items-center gap-12">
           <span className="text-2xl font-bold uppercase flex items-center gap-3"><Info className="h-6 w-6" /> {tenant.runningText}</span>
           <span className="text-2xl font-bold uppercase flex items-center gap-3"><Info className="h-6 w-6" /> Mari bergabung dalam kegiatan Itikaf malam ini pukul 20:00.</span>
           <span className="text-2xl font-bold uppercase flex items-center gap-3"><Info className="h-6 w-6" /> Jazakallahu Khairan bagi para donatur yang telah menyisihkan hartanya.</span>
        </div>
      </div>

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
