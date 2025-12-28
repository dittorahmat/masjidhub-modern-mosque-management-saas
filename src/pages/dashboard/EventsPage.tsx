import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, MapPin, Users, Plus, ExternalLink, User, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Event } from '@shared/types';
export default function EventsPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    });
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Manajemen Kegiatan</h1>
            <p className="text-muted-foreground">Rencanakan kegiatan dan berinteraksi dengan jamaah.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.open(`/portal/${slug}`, '_blank')}>
              <ExternalLink className="h-4 w-4" /> Lihat Portal Publik
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Buat Kegiatan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Jadwalkan Kegiatan Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Judul Kegiatan</Label>
                    <Input name="title" required placeholder="Mis: Buka Bersama Komunitas" />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Textarea name="description" required placeholder="Ceritakan tentang kegiatan ini..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal & Waktu</Label>
                      <Input name="date" type="datetime-local" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Kapasitas</Label>
                      <Input name="capacity" type="number" required defaultValue="100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pembicara / Penceramah / Khatib</Label>
                    <Input name="speaker" required placeholder="Nama pembicara utama" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimal Infak (Rp)</Label>
                      <Input name="minDonation" type="number" defaultValue="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Lokasi</Label>
                      <Input name="location" required placeholder="Mis: Ruang Utama Masjid" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Mempublikasikan...' : 'Publikasikan Kegiatan'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Card key={i} className="h-64 animate-pulse bg-stone-100" />)
          ) : events.length === 0 ? (
            <div className="col-span-full py-20 text-center illustrative-card">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">Belum ada kegiatan yang dijadwalkan.</p>
            </div>
          ) : (
            events.sort((a,b) => a.date - b.date).map((event) => {
              const isPast = event.date < Date.now();
              return (
                <Card key={event.id} className={`illustrative-card ${isPast ? 'opacity-70' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={isPast ? "secondary" : "default"} className={isPast ? "" : "bg-emerald-600"}>
                        {isPast ? "Selesai" : "Mendatang"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {event.currentRegistrations} / {event.capacity} Daftar
                      </span>
                    </div>
                    <CardTitle className="text-2xl font-display">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm text-foreground/80">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        {format(event.date, 'PPP p', { locale: id })}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {event.location}
                      </div>
                      {event.speaker && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          {event.speaker}
                        </div>
                      )}
                      {event.minDonation !== undefined && event.minDonation > 0 && (
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-primary" />
                          {`Rp ${event.minDonation.toLocaleString('id-ID')}`}
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t flex flex-wrap justify-between gap-2">
                      <Button variant="ghost" size="sm">Kelola Pendaftaran</Button>
                      <Button variant="outline" size="sm">Ubah</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}