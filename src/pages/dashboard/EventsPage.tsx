import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
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
  MoreHorizontal, Sparkles, TrendingUp, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Event, EventRegistration } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="space-y-12 pb-10">
      {/* Refined Header (Editorial Style) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-200/60 pb-10"
      >
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-muted-foreground/60 font-bold text-[10px] uppercase tracking-[0.3em]">
            <Sparkles className="h-3 w-3 text-primary/40" />
            <span>Syiar & Dakwah</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary/60">Manajemen Kegiatan</span>
          </nav>
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter italic leading-none">
              Event <span className="text-primary">Manager</span>
            </h1>
            <p className="text-muted-foreground text-xl font-medium max-w-2xl">
              Kelola kegiatan, pendaftaran, dan <span className="text-foreground font-bold underline decoration-stone-200 underline-offset-4">presensi jamaah</span> secara digital.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" className="rounded-full border-2 h-14 px-8 gap-3 font-bold shadow-sm hover:shadow-md transition-all text-base bg-white" onClick={() => window.open(`/portal/${slug}`, '_blank')}>
            <ExternalLink className="h-5 w-5" /> Lihat Portal
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-14 px-10 font-bold gap-3 shadow-xl shadow-primary/20 text-base">
                <Plus className="h-5 w-5" /> Buat Kegiatan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] rounded-[2.5rem] illustrative-card p-10">
              <DialogHeader>
                <DialogTitle className="text-3xl font-display font-bold italic tracking-tight">Jadwalkan Kegiatan</DialogTitle>
                <DialogDescription className="text-lg">Detail ini akan otomatis tampil di portal publik masjid Anda.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Judul Kegiatan</Label>
                  <Input name="title" required placeholder="Mis: Tablig Akbar Ramadan" className="h-14 rounded-xl border-2 focus:ring-primary font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Deskripsi Singkat</Label>
                  <Textarea name="description" required placeholder="Jelaskan isi kegiatan..." className="rounded-xl border-2 min-h-[100px] focus:ring-primary font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Tanggal & Waktu</Label>
                    <Input name="date" type="datetime-local" required className="h-14 rounded-xl border-2 focus:ring-primary font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Kapasitas (Orang)</Label>
                    <Input name="capacity" type="number" required defaultValue="100" className="h-14 rounded-xl border-2 focus:ring-primary font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Pembicara / Guru</Label>
                  <Input name="speaker" required placeholder="Nama Ustadz / Pembicara" className="h-14 rounded-xl border-2 focus:ring-primary font-bold" />
                </div>
                <Button type="submit" className="w-full h-16 text-lg rounded-full font-black bg-primary shadow-xl shadow-primary/20 mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Mempublikasikan...' : 'Publikasikan Kegiatan'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Card key={i} className="h-[400px] rounded-[2.5rem] animate-pulse bg-stone-100 border-none" />)
        ) : events.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-stone-100 flex flex-col items-center gap-6">
            <div className="p-8 bg-stone-50 rounded-full">
               <CalendarIcon className="h-16 w-16 text-muted-foreground opacity-20" />
            </div>
            <div className="space-y-1">
               <p className="text-2xl font-display font-bold italic tracking-tight">Belum Ada Kegiatan</p>
               <p className="text-muted-foreground font-medium">Mulai syiar dengan menjadwalkan kegiatan pertama Anda.</p>
            </div>
          </div>
        ) : (
          events.sort((a,b) => b.date - a.date).map((event, idx) => {
            const isPast = event.date < Date.now();
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <Card className={`illustrative-card h-full flex flex-col group border-none shadow-none hover:shadow-none hover:translate-y-0 ${isPast ? 'bg-stone-50/50 grayscale-[0.5]' : ''}`}>
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-center mb-6">
                      <Badge className={`rounded-full px-4 py-1 font-black text-[10px] tracking-widest ${isPast ? "bg-stone-200 text-stone-600" : "bg-emerald-100 text-emerald-700"}`}>
                        {isPast ? "SELESAI" : "MENDATANG"}
                      </Badge>
                      <div className="flex -space-x-3">
                         {[1,2,3].map(i => (
                           <div key={i} className="h-9 w-9 rounded-full border-4 border-white bg-stone-200 flex items-center justify-center overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Event${event.id}${i}`} alt="user" />
                           </div>
                         ))}
                         <div className="h-9 w-9 rounded-full border-4 border-white bg-primary text-white flex items-center justify-center text-[10px] font-black">
                           +{event.currentRegistrations}
                         </div>
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-display font-bold italic tracking-tight group-hover:text-primary transition-colors leading-tight">{event.title}</CardTitle>
                    <CardDescription className="text-sm font-medium line-clamp-2 mt-3 leading-relaxed">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 space-y-8 flex-1 flex flex-col justify-between">
                    <div className="space-y-4 pt-6 border-t border-stone-100">
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <div className="p-2 bg-stone-50 rounded-lg"><CalendarIcon className="h-4 w-4 text-primary" /></div>
                        {format(event.date, 'PPP p', { locale: id })}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <div className="p-2 bg-stone-50 rounded-lg"><Users className="h-4 w-4 text-primary" /></div>
                        {event.currentRegistrations} / {event.capacity} Jamaah
                      </div>
                      {event.speaker && (
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <div className="p-2 bg-stone-50 rounded-lg"><User className="h-4 w-4 text-primary" /></div>
                          {event.speaker}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <Button 
                        className="rounded-full h-12 font-black gap-2 shadow-lg shadow-primary/10"
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsPresensiOpen(true);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Presensi
                      </Button>
                      <Button variant="outline" className="rounded-full h-12 font-black border-2 gap-2 hover:bg-stone-50">
                        <QrCode className="h-4 w-4" /> Poster
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal Presensi & Registrants */}
      <Dialog open={isPresensiOpen} onOpenChange={setIsPresensiOpen}>
        <DialogContent className="sm:max-w-[950px] rounded-[2.5rem] p-0 overflow-hidden border-none illustrative-card">
          <div className="p-10 bg-stone-50/50 border-b border-stone-100">
            <DialogHeader>
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-2">
                  <DialogTitle className="text-4xl font-display font-black italic tracking-tighter text-slate-900">{selectedEvent?.title}</DialogTitle>
                  <DialogDescription className="text-lg font-medium text-muted-foreground">Manajemen Kehadiran & Data Jamaah Terdaftar</DialogDescription>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-stone-100 flex flex-col items-center min-w-[160px]">
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Attendance Rate</p>
                   <p className="text-5xl font-display font-black text-emerald-600 tracking-tighter">
                      {selectedEvent ? Math.round((Math.random() * 40) + 60) : 0}%
                   </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-8">
            <div className="flex flex-col md:flex-row gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                  <Input className="pl-12 rounded-full border-2 h-14 bg-white shadow-sm focus:ring-primary text-base font-medium" placeholder="Cari Nama atau Email Jamaah..." />
               </div>
               <div className="flex gap-3">
                  <Button variant="outline" className="rounded-full h-14 px-8 font-black border-2 gap-3 hover:bg-stone-50">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Export
                  </Button>
                  <Button className="rounded-full h-14 px-8 font-black gap-3 bg-slate-900 shadow-xl shadow-black/20">
                    <QrCode className="h-5 w-5 text-emerald-400" /> Scanner
                  </Button>
               </div>
            </div>

            <div className="border-2 border-stone-100 rounded-[2rem] overflow-hidden bg-white">
               <Table>
                  <TableHeader className="bg-stone-50/50">
                     <TableRow className="border-b border-stone-100">
                        <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Jamaah</TableHead>
                        <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Kontak</TableHead>
                        <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground text-center">Kehadiran</TableHead>
                        <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground text-right px-10">Aksi</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {[
                       { name: "Ahmad Abdullah", contact: "0812-3456-7890", date: "2 Jam lalu", attended: true },
                       { name: "Siti Rahmawati", contact: "siti@email.com", date: "5 Jam lalu", attended: false },
                       { name: "Budi Setiawan", contact: "0857-1122-3344", date: "Kemarin", attended: true },
                       { name: "Fatimah Zahra", contact: "fatimah@email.com", date: "Kemarin", attended: false },
                     ].map((reg, idx) => (
                       <motion.tr 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-none"
                       >
                          <TableCell className="px-10 py-5">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-stone-100 border-2 border-white shadow-sm overflow-hidden">
                                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reg.name}`} alt="avatar" />
                                </div>
                                <div className="flex flex-col">
                                   <span className="font-black text-slate-800 text-base tracking-tight">{reg.name}</span>
                                   <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">{reg.date}</span>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="font-bold text-muted-foreground">{reg.contact}</TableCell>
                          <TableCell className="text-center">
                             <Badge className={`rounded-full px-4 py-1 font-black text-[10px] ${
                                reg.attended ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"
                             }`}>
                                {reg.attended ? "HADIR" : "ABSEN"}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-right px-10">
                             <Button 
                               size="sm" 
                               variant={reg.attended ? "ghost" : "default"}
                               className={`rounded-full font-black h-10 px-6 text-[10px] tracking-widest transition-all ${
                                 reg.attended ? "text-red-500 hover:bg-red-50" : "shadow-lg shadow-primary/10"
                               }`}
                             >
                               {reg.attended ? "BATAL" : "CHECK-IN"}
                             </Button>
                          </TableCell>
                       </motion.tr>
                     ))}
                  </TableBody>
               </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
