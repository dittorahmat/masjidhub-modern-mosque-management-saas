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

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['prayer-schedules', slug],
    queryFn: () => api<PrayerSchedule[]>(`/api/${slug}/prayer-schedules`)
  });

  const syncMutation = useMutation({
    mutationFn: () => api(`/api/${slug}/prayer-schedules/sync`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-schedules', slug] });
      toast.success(`Sinkronisasi Berhasil!`);
    },
    onError: (e: any) => toast.error(e.message || 'Gagal sinkronisasi.')
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

  const createMutation = useMutation({
    mutationFn: (newSchedule: Omit<PrayerSchedule, 'id' | 'tenantId'>) => 
      api<PrayerSchedule>(`/api/${slug}/prayer-schedules`, {
        method: 'POST',
        body: JSON.stringify({ ...newSchedule, isLocked: true })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-schedules', slug] });
      setIsDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/${slug}/prayer-schedules/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayer-schedules', slug] })
  });

  const toggleLock = (s: PrayerSchedule) => {
    updateMutation.mutate({ id: s.id, isLocked: !s.isLocked });
    toast.info(s.isLocked ? "Jadwal dibuka kunci (Akan mengikuti API)" : "Jadwal dikunci (Tetap manual)");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as any;
    const scheduleData = {
      day: data.day,
      prayerTime: data.prayerTime,
      time: data.time,
      imamName: data.imamName || undefined,
      isLocked: true
    };

    if (editingSchedule) {
      updateMutation.mutate({ ...editingSchedule, ...scheduleData });
    } else {
      createMutation.mutate(scheduleData);
    }
  };

  if (isLoading) return <div className="p-8">Memuat jadwal sholat...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-stone-800">Jadwal Shalat</h1>
            <p className="text-muted-foreground text-sm">Kelola waktu ibadah dan penugasan imam secara hibrida.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => syncMutation.mutate()} 
              disabled={syncMutation.isPending}
              className="rounded-xl gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-10"
            >
              {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Sinkronisasi
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 h-10">
                  <Plus className="h-4 w-4" /> Tambah Manual
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-bold">{editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hari</Label>
                      <Select name="day" defaultValue={editingSchedule?.day || 'monday'} required>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{DAYS.map(day => <SelectItem key={day} value={day}>{DAY_NAMES[day as keyof typeof DAY_NAMES]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Waktu Sholat</Label>
                      <Select name="prayerTime" defaultValue={editingSchedule?.prayerTime || 'fajr'} required>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRAYER_TIMES.map(time => <SelectItem key={time} value={time}>{PRAYER_NAMES[time as keyof typeof PRAYER_NAMES]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu (HH:MM)</Label>
                    <Input name="time" type="time" defaultValue={editingSchedule?.time.substring(0, 5) || '05:00'} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Imam</Label>
                    <Input name="imamName" defaultValue={editingSchedule?.imamName || ''} placeholder="Ustadz Pembina" className="rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl bg-emerald-600 shadow-lg" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Menyimpan...' : 'Simpan & Kunci'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
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
                const daySchedules = schedules.filter(s => s.day === day);
                const scheduleMap: Record<string, PrayerSchedule | undefined> = {};
                daySchedules.forEach(s => { scheduleMap[s.prayerTime] = s; });

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
                              
                              {/* Hover Actions */}
                              <div className="absolute right-1 top-1 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingSchedule(s); setIsDialogOpen(true); }}><Edit className="h-3 w-3 text-stone-400" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="h-3 w-3 text-rose-400" /></Button>
                              </div>
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
          <p className="text-[10px] font-medium italic">Ikon <Lock className="inline h-3 w-3" /> menandakan jadwal manual yang tidak akan berubah saat sinkronisasi API.</p>
        </div>
      </div>
    </div>
  );
}
