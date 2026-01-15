import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar as CalendarIcon, MapPin, Users, Plus, 
  ExternalLink, User, Coins, QrCode, CheckCircle2, 
  XCircle, Search, Download, FileSpreadsheet, 
  MoreHorizontal, Sparkles, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Event, EventRegistration } from '@shared/types';

export default function EventsPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isPresensiOpen, setIsPresensiOpen] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', slug],
    queryFn: () => api<Event[]>(`/api/${slug}/events`)
  });

  const createMutation = useMutation({
    mutationFn: (newEvent: Partial<Event>) => api(`/api/${slug}/events`, {
      method: 'POST',
      body: JSON.stringify(newEvent)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', slug] });
      toast.success('Kegiatan berhasil dipublikasikan');
      setIsDialogOpen(false);
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: new Date(formData.get('date') as string).getTime(),
      location: formData.get('location') as string,
      capacity: Number(formData.get('capacity')),
      speaker: formData.get('speaker') as string,
      minDonation: Number(formData.get('minDonation')),
      isFundraising: formData.get('isFundraising') === 'true',
      targetAmount: Number(formData.get('targetAmount') || 0)
    });
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Header with SaaS Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Sparkles className="h-4 w-4" />
            <span>Syiar & Dakwah</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight italic">
            Event <span className="text-primary">Manager</span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Kelola kegiatan, pendaftaran, dan <span className="text-foreground font-bold">presensi jamaah</span>.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-2 gap-2" onClick={() => window.open(`/portal/${slug}`, '_blank')}>
            <ExternalLink className="h-4 w-4" /> Lihat Portal
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 px-8 font-bold gap-2 shadow-xl shadow-primary/20">
                <Plus className="h-4 w-4" /> Buat Kegiatan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Jadwalkan Kegiatan Baru</DialogTitle>
                <DialogDescription>Isi detail kegiatan untuk ditampilkan di portal publik.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Judul Kegiatan</Label>
                  <Input name="title" required placeholder="Mis: Tablig Akbar Ramadan" className="h-12 rounded-xl border-2" />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi Singkat</Label>
                  <Textarea name="description" required placeholder="Jelaskan isi kegiatan..." className="rounded-xl border-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal & Waktu</Label>
                    <Input name="date" type="datetime-local" required className="h-12 rounded-xl border-2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kapasitas (Orang)</Label>
                    <Input name="capacity" type="number" required defaultValue="100" className="h-12 rounded-xl border-2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pembicara / Guru</Label>
                  <Input name="speaker" required placeholder="Nama Ustadz / Pembicara" className="h-12 rounded-xl border-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <select name="isFundraising" className="w-full h-12 rounded-xl border-2 px-3 text-sm bg-transparent">
                       <option value="false">Kegiatan Biasa (Kajian)</option>
                       <option value="true">Program Penggalangan Dana</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Dana (Opsional)</Label>
                    <Input name="targetAmount" type="number" placeholder="Rp 0" className="h-12 rounded-xl border-2" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 text-lg rounded-2xl font-bold bg-primary shadow-lg mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Mempublikasikan...' : 'Publikasikan Sekarang'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Card key={i} className="h-80 rounded-[2.5rem] animate-pulse bg-stone-100" />)
        ) : events.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] shadow-sm border-2 border-dashed border-stone-200">
            <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-10" />
            <p className="text-xl font-bold text-muted-foreground">Belum ada kegiatan yang dijadwalkan.</p>
          </div>
        ) : (
          events.sort((a,b) => b.date - a.date).map((event) => {
            const isPast = event.date < Date.now();
            return (
              <Card key={event.id} className={`rounded-[2.5rem] border-none shadow-sm overflow-hidden group hover:shadow-xl transition-all ${isPast ? 'bg-stone-50 grayscale-[0.5]' : 'bg-white'}`}>
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <Badge className={isPast ? "bg-stone-400" : "bg-emerald-500"}>
                      {isPast ? "Selesai" : "Mendatang"}
                    </Badge>
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => (
                         <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center text-[10px] font-bold">
                           U{i}
                         </div>
                       ))}
                       <div className="h-8 w-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                         +{event.currentRegistrations}
                       </div>
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-display font-bold group-hover:text-primary transition-colors">{event.title}</CardTitle>
                  <CardDescription className="text-sm font-medium line-clamp-2 mt-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-6">
                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      {format(event.date, 'PPP p', { locale: id })}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <Users className="h-4 w-4 text-primary" />
                      {event.currentRegistrations} / {event.capacity} Jamaah Terdaftar
                    </div>
                    {event.speaker && (
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <User className="h-4 w-4 text-primary" />
                        {event.speaker}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button 
                      className="rounded-xl h-12 font-bold gap-2"
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsPresensiOpen(true);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Presensi
                    </Button>
                    <Button variant="outline" className="rounded-xl h-12 font-bold border-2 gap-2">
                      <QrCode className="h-4 w-4" /> QR Poster
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Presensi & Registrants (The ATM Modification) */}
      <Dialog open={isPresensiOpen} onOpenChange={setIsPresensiOpen}>
        <DialogContent className="sm:max-w-[900px] rounded-[3rem] p-10">
          <DialogHeader className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-3xl font-display font-bold italic">{selectedEvent?.title}</DialogTitle>
                <DialogDescription className="text-lg font-medium">Manajemen Kehadiran & Pendaftaran Jamaah</DialogDescription>
              </div>
              <div className="text-right">
                 <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">Attendance Rate</p>
                 <p className="text-4xl font-black text-emerald-600">
                    {selectedEvent ? Math.round((Math.random() * 40) + 60) : 0}%
                 </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-6 mb-8">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10 rounded-2xl border-2 h-12" placeholder="Cari Nama atau Email Jamaah..." />
             </div>
             <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-2 gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Export Excel
             </Button>
             <Button className="rounded-2xl h-12 px-6 font-bold gap-2 bg-slate-900">
                <QrCode className="h-4 w-4" /> Buka Scanner
             </Button>
          </div>

          <div className="border-2 rounded-[2rem] overflow-hidden">
             <Table>
                <TableHeader className="bg-stone-50">
                   <TableRow className="border-none">
                      <TableHead className="px-8 py-4 font-bold uppercase text-[10px] tracking-widest">Nama Jamaah</TableHead>
                      <TableHead className="py-4 font-bold uppercase text-[10px] tracking-widest">Kontak</TableHead>
                      <TableHead className="py-4 font-bold uppercase text-[10px] tracking-widest">Waktu Daftar</TableHead>
                      <TableHead className="py-4 font-bold uppercase text-[10px] tracking-widest">Status Kehadiran</TableHead>
                      <TableHead className="py-4 font-bold uppercase text-[10px] tracking-widest text-center px-8">Aksi</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {/* Mock Data for Presensi Simulation */}
                   {[
                     { name: "Ahmad Abdullah", contact: "0812-3456-7890", date: "2 Jam lalu", attended: true },
                     { name: "Siti Rahmawati", contact: "siti@email.com", date: "5 Jam lalu", attended: false },
                     { name: "Budi Setiawan", contact: "0857-1122-3344", date: "Kemarin", attended: true },
                     { name: "Fatimah Zahra", contact: "fatimah@email.com", date: "Kemarin", attended: false },
                   ].map((reg, idx) => (
                     <TableRow key={idx} className="hover:bg-stone-50 border-stone-100">
                        <TableCell className="px-8 font-bold text-lg">{reg.name}</TableCell>
                        <TableCell className="font-medium text-muted-foreground">{reg.contact}</TableCell>
                        <TableCell className="text-sm">{reg.date}</TableCell>
                        <TableCell>
                           <Badge className={reg.attended ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}>
                              {reg.attended ? "Sudah Hadir" : "Belum Hadir"}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-center px-8">
                           <Button 
                             size="sm" 
                             variant={reg.attended ? "ghost" : "default"}
                             className="rounded-xl font-bold h-9 px-4"
                           >
                             {reg.attended ? <XCircle className="h-4 w-4" /> : "Check-in"}
                           </Button>
                        </TableCell>
                     </TableRow>
                   ))}
                </TableBody>
             </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
