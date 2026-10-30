import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useUserName, useTenantName } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Wallet, Users, Calendar, TrendingUp, Package, Sparkles, 
  ArrowUpRight, AlertCircle, ArrowDownCircle, ArrowUpCircle,
  Activity, Bell, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Transaction, InventoryItem, Event, AppUser } from '@shared/types';

export function OverviewPage() {
  const { slug } = useParams();
  const userName = useUserName();
  const tenantName = useTenantName();

  const { data: transactions = [] } = useQuery({
    queryKey: ['finance', slug],
    queryFn: () => api<Transaction[]>(`/api/${slug}/finance`)
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory', slug],
    queryFn: () => api<InventoryItem[]>(`/api/${slug}/inventory`)
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', slug],
    queryFn: () => api<Event[]>(`/api/${slug}/events`)
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', slug],
    queryFn: () => api<AppUser[]>(`/api/${slug}/members`)
  });

  const totals = transactions.reduce((acc, tx) => {
    if (tx.type === 'income') acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const balance = totals.income - totals.expense;

  // Financial Insights (ATM dari Masjidku)
  const insights = [];
  if (balance > 10000000) {
    insights.push({
      title: "Dana Mengendap Cukup Besar",
      desc: "Saldo kas melebihi Rp 10jt. Pertimbangkan untuk menyalurkan ke program mustahik atau pembangunan agar dana lebih produktif.",
      type: "warning"
    });
  }
  if (totals.expense > totals.income) {
    insights.push({
      title: "Defisit Terdeteksi",
      desc: "Pengeluaran bulan ini melebihi pemasukan. Evaluasi kembali pos biaya operasional.",
      type: "danger"
    });
  }

  const chartData = [
    { name: 'Sen', income: 4000, expense: 2400 },
    { name: 'Sel', income: 3000, expense: 1398 },
    { name: 'Rab', income: 2000, expense: 9800 },
    { name: 'Kam', income: 2780, expense: 3908 },
    { name: 'Jum', income: 8500, expense: 4800 },
    { name: 'Sab', income: 2390, expense: 3800 },
    { name: 'Min', income: 3490, expense: 4300 },
  ];

  return (
    <div className="space-y-12 pb-10">
      {/* Refined Header (Issue #2: Distill) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-stone-500 font-medium text-xs">
            <span>Sistem Manajemen Masjid</span>
            <span>/</span>
            <span className="text-emerald-800 font-semibold">{tenantName}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-slate-900">
            Ringkasan Eksekutif
          </h1>
          <p className="text-stone-500 text-sm">
            Status keuangan, kehadiran jamaah, dan operasional terkini per hari ini.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link to={`/portal/${slug}`} target="_blank">
            <Button variant="outline" className="rounded-xl border border-stone-300 h-11 px-5 gap-2 font-medium text-sm">
              Portal Publik <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button className="rounded-xl h-11 px-6 font-medium gap-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white">
            <TrendingUp className="h-4 w-4" /> Export Laporan
          </Button>
        </div>
      </div>

      {/* Financial Insights Section (ATM) */}
      {insights.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <Alert key={idx} variant={insight.type === 'danger' ? 'destructive' : 'default'} className="rounded-3xl border-2 bg-white  border-amber-100 bg-amber-50/30">
              <AlertCircle className={`h-5 w-5 ${insight.type === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
              <AlertTitle className="font-bold text-lg mb-1">{insight.title}</AlertTitle>
              <AlertDescription className="text-muted-foreground font-medium">
                {insight.desc}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* High-Level Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Kas" 
          value={`Rp ${balance.toLocaleString('id-ID')}`} 
          icon={<Wallet className="h-6 w-6" />} 
          trend="+12.5%" 
          trendType="up"
          color="primary"
          delay={0.1} 
        />
        <StatCard 
          title="Jamaah Terdaftar" 
          value={members.length.toString()} 
          icon={<Users className="h-6 w-6" />} 
          trend="+8" 
          trendType="up"
          color="blue"
          delay={0.2} 
        />
        <StatCard 
          title="Kegiatan Aktif" 
          value={events.length.toString()} 
          icon={<Calendar className="h-6 w-6" />} 
          trend="Bulan ini" 
          color="amber"
          delay={0.3} 
        />
        <StatCard 
          title="Kesehatan Aset" 
          value="98%" 
          icon={<Activity className="h-6 w-6" />} 
          trend="Sangat Baik" 
          color="emerald"
          delay={0.4} 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <Card className="lg:col-span-2 illustrative-card border-none hover:shadow-none shadow-none">
          <CardHeader className="p-8 pb-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Visualisasi Arus Kas
                </CardTitle>
                <CardDescription className="text-base font-medium">Analisis pemasukan infaq dan biaya operasional</CardDescription>
              </div>
              <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
                 <Button size="sm" variant="ghost" className="rounded-lg font-bold text-xs h-8 px-4 bg-white ">Mingguan</Button>
                 <Button size="sm" variant="ghost" className="rounded-lg font-bold text-xs h-8 px-4">Bulanan</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] p-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                />
                <Area type="monotone" dataKey="income" stroke="#059669" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={4} name="Pemasukan" />
                <Area type="monotone" dataKey="expense" stroke="#F43F5E" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={4} name="Pengeluaran" strokeDasharray="10 10" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Sidebar: Recent Activity & Quick Actions */}
        <div className="space-y-8">
          <Card className="illustrative-card p-8">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Aktivitas Terkini
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <ActivityItem 
                icon={<ArrowUpCircle className="text-emerald-500" />} 
                title="Infaq Jumat Masuk" 
                time="2 jam yang lalu" 
                value="+Rp 1.250.000"
              />
              <ActivityItem 
                icon={<ArrowDownCircle className="text-red-500" />} 
                title="Servis AC Masjid" 
                time="5 jam yang lalu" 
                value="-Rp 450.000"
              />
              <ActivityItem 
                icon={<Users className="text-blue-500" />} 
                title="5 Jamaah Terdaftar" 
                time="Kemarin" 
                value="Kajian Fikih"
              />
              <Button variant="ghost" className="w-full rounded-2xl h-12 font-bold text-primary hover:bg-primary/5 gap-2 group mt-2">
                Lihat Semua Aktivitas <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none  bg-primary text-white p-8 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 space-y-4">
               <h3 className="text-2xl font-black italic">Upgrade Ke Pro</h3>
               <p className="text-primary-foreground/80 font-medium">Dapatkan fitur Custom Domain & Multi-User untuk DKM Anda.</p>
               <Button className="w-full bg-white text-primary hover:bg-stone-100 rounded-2xl h-12 font-bold ">
                 Pelajari Paket Pro
               </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold text-stone-500">{title}</span>
        <div className="text-stone-400">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
        {trend && (
          <p className="text-xs text-stone-500 font-medium">{trend}</p>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, time, value }: any) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <div className="p-3 bg-stone-50 rounded-2xl group-hover:bg-white transition-all">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{title}</p>
        <p className="text-xs text-muted-foreground font-medium">{time}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-black">{value}</p>
      </div>
    </div>
  );
}
