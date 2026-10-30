import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Event } from '@shared/types';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';

export function EventPublicCard({ event, slug }: { event: Event; slug: string }) {
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) =>
      api(`/api/${slug}/events/${event.id}/register`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setOpen(false);
      toast.success('Pendaftaran Berhasil!', {
        description: `Konfirmasi pendaftaran untuk "${event.title}" telah diterima.`,
      });
    },
  });

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    mutation.mutate(data);
  };

  const isFull = event.currentRegistrations >= event.capacity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="illustrative-card overflow-hidden h-full flex flex-col group p-0 border-none shadow-none hover:shadow-none hover:translate-y-0">
        <div className="h-56 sm:h-64 overflow-hidden relative">
          <img
            src={
              event.imageUrl ||
              'https://images.unsplash.com/photo-1519810755548-39cd217da494?auto=format&fit=crop&q=80'
            }
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-4 left-4">
            <Badge className="bg-white/90 backdrop-blur-md text-slate-900 font-bold px-3.5 py-1 rounded-full border-none shadow-sm text-xs">
              {format(event.date, 'dd MMM', { locale: id })}
            </Badge>
          </div>
        </div>
        <CardContent className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xl sm:text-2xl font-display font-bold leading-tight group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
              {event.description}
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-bold pt-1">
              <Clock className="h-4 w-4 text-primary" />
              {format(event.date, 'p', { locale: id })} WIB
            </div>
          </div>

          <ResponsiveDialog open={open} onOpenChange={setOpen}>
            <Button
              onClick={() => setOpen(true)}
              className="w-full rounded-full min-h-[44px] h-12 mt-6 font-bold gap-2 shadow-md shadow-primary/10 transition-all hover:scale-[1.01]"
              disabled={isFull}
            >
              {isFull ? 'Kuota Penuh' : 'Ikuti Kegiatan'} <ArrowRight className="h-4 w-4" />
            </Button>
            <ResponsiveDialogContent className="rounded-3xl border-none p-6 sm:p-8 max-w-md bg-white">
              <ResponsiveDialogHeader className="text-left space-y-1">
                <ResponsiveDialogTitle className="text-2xl font-display font-bold">
                  Pendaftaran Kegiatan
                </ResponsiveDialogTitle>
                <ResponsiveDialogDescription className="text-sm font-medium">
                  {event.title}
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <form onSubmit={handleRegister} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Nama Lengkap
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Masukkan nama Anda"
                    className="min-h-[44px] rounded-xl border-stone-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Nomor WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    type="tel"
                    placeholder="0812..."
                    className="min-h-[44px] rounded-xl border-stone-200"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full min-h-[44px] h-12 rounded-full font-bold text-base"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Memproses...' : 'Konfirmasi Kehadiran'}
                </Button>
              </form>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </CardContent>
      </Card>
    </motion.div>
  );
}
