import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Wallet, Calendar, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { GlobalStats } from '@shared/types';
export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['super', 'summary'],
    queryFn: () => api<GlobalStats>('/api/super/summary')
  });
  const chartData = [
    { name: 'Jan', mosques: 4, users: 40 },
    { name: 'Feb', mosques: 7, users: 120 },
    { name: 'Mar', mosques: 12, users: 300 },
    { name: 'Apr', mosques: 18, users: 450 },
    { name: 'May', mosques: 25, users: 680 },
    { name: 'Jun', mosques: 32, users: 890 },
  ];
  if (isLoading) return <div className="space-y-4">Loading stats...</div>;
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-4xl font-display font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">Aggregated health and growth metrics across all mosque tenants.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Mosques" value={stats?.totalTenants.toString() || '0'} icon={<Building2 className="h-5 w-5" />} trend="+4 this month" />
        <StatCard title="Total Active Users" value={stats?.totalUsers.toString() || '0'} icon={<Users className="h-5 w-5" />} trend="+15% growth" />
        <StatCard title="Platform Balance" value={`Rp ${stats?.totalBalance.toLocaleString('id-ID')}`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Global Active Events" value={stats?.activeEvents.toString() || '0'} icon={<Calendar className="h-5 w-5" />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="illustrative-card">
          <CardHeader>
            <CardTitle>Onboarding Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="mosques" stroke="#059669" fill="#059669" fillOpacity={0.1} strokeWidth={2} name="New Mosques" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="illustrative-card">
          <CardHeader>
            <CardTitle>User Acquisition</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#D97706" radius={[4, 4, 0, 0]} name="Total Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: string }) {
  return (
    <Card className="illustrative-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-stone-100 rounded-lg text-foreground/80">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && <p className="text-xs text-emerald-600 mt-1 font-medium">{trend}</p>}
      </CardContent>
    </Card>
  );
}