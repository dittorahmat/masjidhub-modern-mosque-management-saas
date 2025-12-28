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
import { Plus, Clock, User, Calendar, Trash2, Edit } from 'lucide-react';
import type { PrayerSchedule } from '@shared/types';

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
  
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['prayer-schedules', slug],
    queryFn: () => api<PrayerSchedule[]>(`/api/${slug}/prayer-schedules`)
  });

  const [editingSchedule, setEditingSchedule] = useState<PrayerSchedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (newSchedule: Omit<PrayerSchedule, 'id' | 'tenantId'>) => 
      api<PrayerSchedule>(`/api/${slug}/prayer-schedules`, {
        method: 'POST',
        body: JSON.stringify(newSchedule)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-schedules', slug] });
      toast.success('Jadwal sholat berhasil ditambahkan');
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Gagal menambahkan jadwal sholat');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedSchedule: PrayerSchedule) => 
      api<PrayerSchedule>(`/api/${slug}/prayer-schedules/${updatedSchedule.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          day: updatedSchedule.day,
          prayerTime: updatedSchedule.prayerTime,
          time: updatedSchedule.time,
          imamName: updatedSchedule.imamName,
          khatibName: updatedSchedule.khatibName
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-schedules', slug] });
      toast.success('Jadwal sholat berhasil diperbarui');
      setIsDialogOpen(false);
      setEditingSchedule(null);
    },
    onError: () => {
      toast.error('Gagal memperbarui jadwal sholat');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      api(`/api/${slug}/prayer-schedules/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-schedules', slug] });
      toast.success('Jadwal sholat berhasil dihapus');
    },
    onError: () => {
      toast.error('Gagal menghapus jadwal sholat');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as any;

    const scheduleData = {
      day: data.day,
      prayerTime: data.prayerTime,
      time: data.time,
      imamName: data.imamName || undefined,
      khatibName: data.khatibName || undefined
    };

    if (editingSchedule) {
      updateMutation.mutate({
        ...editingSchedule,
        ...scheduleData
      });
    } else {
      createMutation.mutate(scheduleData);
    }
  };

  const handleEdit = (schedule: PrayerSchedule) => {
    setEditingSchedule(schedule);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const groupedSchedules = DAYS.map(day => ({
    day,
    schedules: schedules.filter(s => s.day === day)
  }));

  if (isLoading) {
    return <div className="p-8">Memuat jadwal sholat...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-display font-bold">Jadwal Sholat</h1>
          <p className="text-muted-foreground">Atur jadwal sholat lima waktu dan penugasan imam/khatib.</p>
        </div>

        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingSchedule(null);
                setIsDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Sholat'}</DialogTitle>
                <DialogDescription>
                  {editingSchedule ? 'Ubah detail jadwal sholat' : 'Tambahkan jadwal sholat baru'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="day">Hari</Label>
                  <Select 
                    name="day" 
                    defaultValue={editingSchedule?.day || 'monday'}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day} value={day}>
                          {DAY_NAMES[day as keyof typeof DAY_NAMES]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prayerTime">Waktu Sholat</Label>
                  <Select 
                    name="prayerTime" 
                    defaultValue={editingSchedule?.prayerTime || 'fajr'}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRAYER_TIMES.map(time => (
                        <SelectItem key={time} value={time}>
                          {PRAYER_NAMES[time as keyof typeof PRAYER_NAMES]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Waktu (HH:MM)</Label>
                  <Input 
                    id="time" 
                    name="time" 
                    type="time" 
                    defaultValue={editingSchedule?.time.substring(0, 5) || '05:00'} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imamName">Nama Imam</Label>
                  <Input 
                    id="imamName" 
                    name="imamName" 
                    defaultValue={editingSchedule?.imamName || ''} 
                    placeholder="Nama imam pengganti"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="khatibName">Nama Khatib (Khusus Jumat)</Label>
                  <Input 
                    id="khatibName" 
                    name="khatibName" 
                    defaultValue={editingSchedule?.khatibName || ''} 
                    placeholder="Nama khatib Jumat"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingSchedule(null);
                    }}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="bg-stone-100 p-1 rounded-xl w-full sm:w-auto flex flex-wrap h-auto">
            <TabsTrigger value="daily" className="rounded-lg gap-2 flex-1 sm:flex-initial">
              <Calendar className="h-4 w-4" /> Harian
            </TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-lg gap-2 flex-1 sm:flex-initial">
              <Calendar className="h-4 w-4" /> Mingguan
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-4">
            {DAYS.map(day => {
              const daySchedules = schedules.filter(s => s.day === day);
              return (
                <Card key={day} className="illustrative-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {DAY_NAMES[day as keyof typeof DAY_NAMES]}
                    </CardTitle>
                    <CardDescription>
                      {daySchedules.length > 0 
                        ? `Jadwal untuk ${DAY_NAMES[day as keyof typeof DAY_NAMES]}` 
                        : `Belum ada jadwal untuk ${DAY_NAMES[day as keyof typeof DAY_NAMES]}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {daySchedules.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Waktu Sholat</TableHead>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Imam</TableHead>
                            <TableHead>Khatib</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {daySchedules.map(schedule => (
                            <TableRow key={schedule.id}>
                              <TableCell>
                                <Badge variant="outline">
                                  {PRAYER_NAMES[schedule.prayerTime as keyof typeof PRAYER_NAMES]}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {schedule.time.substring(0, 5)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {schedule.imamName ? (
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {schedule.imamName}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {schedule.khatibName ? (
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {schedule.khatibName}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(schedule)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(schedule.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Belum ada jadwal untuk hari ini
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
          
          <TabsContent value="weekly" className="space-y-4">
            <Card className="illustrative-card">
              <CardHeader>
                <CardTitle>Ringkasan Mingguan</CardTitle>
                <CardDescription>Lihat semua jadwal sholat dalam satu tampilan</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hari</TableHead>
                      <TableHead>Subuh</TableHead>
                      <TableHead>Dzuhur</TableHead>
                      <TableHead>Ashar</TableHead>
                      <TableHead>Maghrib</TableHead>
                      <TableHead>Isya</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DAYS.map(day => {
                      const daySchedules = schedules.filter(s => s.day === day);
                      const scheduleMap: Record<string, PrayerSchedule | undefined> = {};
                      daySchedules.forEach(s => {
                        scheduleMap[s.prayerTime] = s;
                      });

                      return (
                        <TableRow key={day}>
                          <TableCell className="font-medium">
                            {DAY_NAMES[day as keyof typeof DAY_NAMES]}
                          </TableCell>
                          {PRAYER_TIMES.map(time => {
                            const schedule = scheduleMap[time];
                            return (
                              <TableCell key={time}>
                                {schedule ? (
                                  <div className="flex flex-col">
                                    <span className="font-mono">{schedule.time.substring(0, 5)}</span>
                                    {schedule.imamName && (
                                      <span className="text-xs text-muted-foreground">Imam: {schedule.imamName}</span>
                                    )}
                                    {schedule.khatibName && (
                                      <span className="text-xs text-muted-foreground">Khatib: {schedule.khatibName}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}