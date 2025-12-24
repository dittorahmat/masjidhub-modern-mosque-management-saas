import React from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Users, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function OverviewPage() {
  const user = useAppStore(s => s.user);
  const currentTenant = useAppStore(s => s.currentTenant);
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Assalamu’alaikum, {user?.name || 'Admin'}</h1>
        <p className="text-muted-foreground">Welcome back to {currentTenant?.name}’s command center.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Monthly Infaq" value="Rp 12,450,000" icon={<Wallet className="h-5 w-5" />} trend="+12%" />
        <StatCard title="Active Members" value="248" icon={<Users className="h-5 w-5" />} trend="+5" />
        <StatCard title="Events This Month" value="6" icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Growth" value="18%" icon={<TrendingUp className="h-5 w-5" />} trend="+2%" />
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="illustrative-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl">
              <Wallet className="h-5 w-5" /> Record Infaq
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl">
              <Calendar className="h-5 w-5" /> New Event
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl">
              <Users className="h-5 w-5" /> Add Member
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl">
              <TrendingUp className="h-5 w-5" /> Report
            </Button>
          </CardContent>
        </Card>
        <Card className="illustrative-card">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <div>
                <p className="font-bold">Friday Sermon (Jumu'ah)</p>
                <p className="text-xs text-muted-foreground">Every Friday, 12:30 PM</p>
              </div>
              <Button size="sm" variant="ghost">View</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <div>
                <p className="font-bold">Basic Arabic Class</p>
                <p className="text-xs text-muted-foreground">Oct 24, 7:00 PM</p>
              </div>
              <Button size="sm" variant="ghost">View</Button>
            </div>
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
            {trend} <span className="text-muted-foreground ml-1">from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}