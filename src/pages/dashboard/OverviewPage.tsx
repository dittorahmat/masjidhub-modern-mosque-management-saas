import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Users, Calendar, TrendingUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Transaction, InventoryItem } from '@shared/types';
export function OverviewPage() {
  const { slug } = useParams();
  const userName = useAppStore(s => s.user?.name);
  const tenantName = useAppStore(s => s.currentTenant?.name);
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
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Assalamu’alaikum, {userName || 'Admin'}</h1>
        <p className="text-muted-foreground">Selamat datang kembali di pusat komando {tenantName || 'masjid Anda'}.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Saldo Saat Ini" value={`Rp ${(totals.income - totals.expense).toLocaleString('id-ID')}`} icon={<Wallet className="h-5 w-5" />} trend="+12%" />
        <StatCard title="Aset Inventaris" value={inventory.length.toString()} icon={<Package className="h-5 w-5" />} trend="Kondisi Baik" />
        <StatCard title="Kegiatan Mendatang" value="3" icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Anggota Aktif" value="124" icon={<Users className="h-5 w-5" />} trend="+5 baru" />
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 illustrative-card overflow-hidden">
          <CardHeader>
            <CardTitle>Tren Infaq & Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="income" stroke="#059669" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} name="Pemasukan" />
                <Area type="monotone" dataKey="expense" stroke="#D97706" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} name="Pengeluaran" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="illustrative-card">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-xl border-2 hover:border-primary/50 hover:bg-emerald-50/50 transition-colors">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold">Infaq Baru</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-xl border-2 hover:border-primary/50 hover:bg-emerald-50/50 transition-colors">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold">Tambah Aset</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-xl border-2 hover:border-primary/50 hover:bg-emerald-50/50 transition-colors">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold">Kegiatan Baru</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-xl border-2 hover:border-primary/50 hover:bg-emerald-50/50 transition-colors">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold">Laporan</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: string }) {
  return (
    <Card className="illustrative-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-emerald-600 mt-1">
            {trend} <span className="text-muted-foreground ml-1">status</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}