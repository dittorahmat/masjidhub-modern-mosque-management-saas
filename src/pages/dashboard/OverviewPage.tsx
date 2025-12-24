import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useUserName, useTenantName } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Users, Calendar, TrendingUp, Package, Sparkles, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import type { Transaction, InventoryItem } from '@shared/types';
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
  const totals = transactions.reduce((acc, tx) => {
    if (tx.type === 'income') acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });
  const chartData = [
    { name: 'Sen', income: 4000, expense: 2400 },
    { name: 'Sel', income: 3000, expense: 1398 },
    { name: 'Rab', income: 2000, expense: 9800 },
    { name: 'Kam', income: 2780, expense: 3908 },
    { name: 'Jum', income: 1890, expense: 4800 },
    { name: 'Sab', income: 2390, expense: 3800 },
    { name: 'Min', income: 3490, expense: 4300 },
  ];
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Dashboard Aktif</span>
          </div>
          <h1 className="text-4xl font-display font-bold">Assalamu’alaikum, {userName?.split(' ')[0] || 'Admin'}</h1>
          <p className="text-muted-foreground text-lg">Kelola <span className="text-foreground font-medium">{tenantName}</span> hari ini dengan mudah.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-2">Bantuan</Button>
          <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20">
            Export Laporan <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Saldo Saat Ini" value={`Rp ${(totals.income - totals.expense).toLocaleString('id-ID')}`} icon={<Wallet className="h-5 w-5" />} trend="+12% bulan ini" delay={0.1} />
        <StatCard title="Aset Inventaris" value={inventory.length.toString()} icon={<Package className="h-5 w-5" />} trend="Kondisi Terpantau" delay={0.2} />
        <StatCard title="Kegiatan Baru" value="3" icon={<Calendar className="h-5 w-5" />} trend="Minggu ini" delay={0.3} />
        <StatCard title="Anggota Aktif" value="124" icon={<Users className="h-5 w-5" />} trend="+5 jamaah baru" delay={0.4} />
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 illustrative-card overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tren Infaq & Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="income" stroke="#059669" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} name="Infaq" />
                <Area type="monotone" dataKey="expense" stroke="#D97706" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} name="Operasional" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="illustrative-card">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <QuickActionButton icon={<Wallet />} label="Infaq Baru" />
            <QuickActionButton icon={<Package />} label="Aset Baru" />
            <QuickActionButton icon={<Calendar />} label="Kegiatan" />
            <QuickActionButton icon={<TrendingUp />} label="Laporan" />
          </CardContent>
          <div className="px-6 pb-6">
            <div className="p-4 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
              <p className="text-xs text-muted-foreground text-center">Tarik dan lepas widget untuk kustomisasi dasbor Anda.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
function StatCard({ title, value, icon, trend, delay = 0 }: { title: string, value: string, icon: React.ReactNode, trend?: string, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Card className="illustrative-card group hover:-translate-y-1 transition-transform">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display">{value}</div>
          {trend && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              {trend}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
function QuickActionButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <Button
      variant="outline"
      className="h-24 flex-col gap-2 rounded-xl border-2 hover:border-primary/50 hover:bg-emerald-50/50 hover:scale-[1.02] transition-all"
    >
      <div className="text-primary">{icon}</div>
      <span className="text-xs font-bold">{label}</span>
    </Button>
  );
}