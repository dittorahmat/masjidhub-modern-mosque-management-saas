import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Clock, 
  User, 
  Calendar, 
  Trash2, 
  Edit, 
  RefreshCcw, 
  Lock, 
  Unlock, 
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import type { PrayerSchedule } from '@shared/types';
import { cn } from '@/lib/utils';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const PRAYER_TIMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const DAY_NAMES = {
  'sunday': 'Minggu',
  'monday': 'Senin',
  'tuesday': 'Selasa',
  'wednesday': 'Rabu',
  'thursday': 'Kamis',
  'friday': 'Jumat',
  'saturday': 'Sabtu'
};

const PRAYER_NAMES = {
  'fajr': 'Subuh',
  'dhuhr': 'Dzuhur',
  'asr': 'Ashar',
  'maghrib': 'Maghrib',
  'isha': 'Isya'
};

export default function PrayerSchedulePage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [editingSchedule, setEditingSchedule] = useState<PrayerSchedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{current: number, total: number} | null>(null);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['prayer-schedules', slug],
    queryFn: () => api<PrayerSchedule[]>(`/api/${slug}/prayer-schedules`)
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      setSyncProgress({ current: 0, total: 12 });
      
      for (let i = 0; i < 12; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        await api(`/api/${slug}/prayer-schedules/sync-month`, {
          method: 'POST',
          body: JSON.stringify({
            year: targetDate.getFullYear(),
            month: targetDate.getMonth() + 1
          })
        });
        setSyncProgress(prev => prev ? { ...prev, current: i + 1 } : null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-schedules', slug] });
      toast.success(`Alhamdulillah! Jadwal 1 tahun berhasil disinkronkan.`);
      setSyncProgress(null);
    },
    onError: (e: any) => {
      toast.error(e.message || 'Gagal sinkronisasi.');
      setSyncProgress(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updated: Partial<PrayerSchedule> & { id: string }) => 
      api<PrayerSchedule>(`/api/${slug}/prayer-schedules/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-schedules', slug] });
      toast.success('Jadwal diperbarui');
      setIsDialogOpen(false);
      setEditingSchedule(null);
    }
  });

  const toggleLock = (s: PrayerSchedule) => {
    updateMutation.mutate({ id: s.id, isLocked: !s.isLocked });
    toast.info(s.isLocked ? "Jadwal dibuka kunci" : "Jadwal dikunci");
  };

  if (isLoading) return <div className="p-8">Memuat jadwal sholat...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-stone-800">Jadwal Shalat</h1>
            <p className="text-muted-foreground text-sm">Kelola waktu ibadah harian secara akurat.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => syncMutation.mutate()} 
              disabled={syncMutation.isPending}
              className="rounded-xl gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-10 relative overflow-hidden"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Bulan {syncProgress?.current}/{syncProgress?.total}</span>
                  <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-300" style={{ width: `${(syncProgress?.current || 0) / (syncProgress?.total || 1) * 100}%` }} />
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  <span>Sinkronisasi 1 Tahun</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="rounded-[2.5rem] border-stone-200 shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-stone-50/50">
              <TableRow>
                <TableHead className="px-8 h-14 text-[10px] uppercase font-bold text-stone-400">Hari / Waktu</TableHead>
                {PRAYER_TIMES.map(pt => (
                  <TableHead key={pt} className="text-[10px] uppercase font-bold text-center text-stone-400">{PRAYER_NAMES[pt as keyof typeof PRAYER_NAMES]}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAYS.map(day => {
                // For simplicity in weekly template view, we show current week's average or most recent data
                const daySchedules = schedules.filter(s => s.day === day);
                const scheduleMap: Record<string, PrayerSchedule | undefined> = {};
                // If we have daily data, pick the one for current week or just the first one found
                daySchedules.forEach(s => { 
                  if (!scheduleMap[s.prayerTime]) scheduleMap[s.prayerTime] = s;
                });

                return (
                  <TableRow key={day} className="hover:bg-stone-50/30 transition-colors border-stone-100 h-24">
                    <TableCell className="px-8 font-black text-stone-800 text-sm">
                      {DAY_NAMES[day as keyof typeof DAY_NAMES]}
                    </TableCell>
                    {PRAYER_TIMES.map(time => {
                      const s = scheduleMap[time];
                      return (
                        <TableCell key={time} className="text-center group relative p-0">
                          {s ? (
                            <div className="flex flex-col items-center justify-center h-full w-full gap-1">
                              <button 
                                onClick={() => toggleLock(s)}
                                className={cn(
                                  "flex items-center gap-1.5 font-mono font-black text-base px-3 py-1 rounded-full transition-all",
                                  s.isLocked ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                )}
                              >
                                {s.time.substring(0, 5)}
                                {s.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3 opacity-20" />}
                              </button>
                              <span className="text-[10px] text-stone-400 font-bold truncate max-w-[90px]">
                                {s.imamName || '-'}
                              </span>
                            </div>
                          ) : <span className="text-stone-200 text-xs">-</span>}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        <div className="flex items-center gap-2 text-stone-400 justify-center">
          <Info className="h-4 w-4" />
          <p className="text-[10px] font-medium italic">Menampilkan jadwal mingguan acuan. Perubahan harian otomatis tersinkron ke layar Kiosk.</p>
        </div>
      </div>
    </div>
  );
}
