import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Mail, Shield, ChevronRight, Users, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { AppUser } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function MembersPage() {
  const { slug } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', slug],
    queryFn: () => api<AppUser[]>(`/api/${slug}/members`)
  });

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin_platform': return <Badge variant="destructive" className="font-black text-[10px] rounded-full px-3">PLATFORM ADMIN</Badge>;
      case 'dkm_admin': return <Badge className="bg-emerald-100 text-emerald-700 font-black text-[10px] rounded-full px-3">DKM ADMIN</Badge>;
      case 'amil_zakat': return <Badge className="bg-amber-100 text-amber-700 font-black text-[10px] rounded-full px-3">AMIL ZAKAT</Badge>;
      case 'ustadz': return <Badge className="bg-blue-100 text-blue-700 font-black text-[10px] rounded-full px-3">USTADZ</Badge>;
      default: return <Badge variant="outline" className="font-black text-[10px] rounded-full px-3">JAMAAH</Badge>;
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Undangan berhasil dikirim!', {
      description: 'Email instruksi akses telah dikirim ke alamat yang dituju.'
    });
    setIsInviteOpen(false);
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
            <Users className="h-3 w-3 text-primary/40" />
            <span>Manajemen Komunitas</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary/60">Direktori Anggota</span>
          </nav>
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter italic leading-none">
              Database <span className="text-primary">Ummat</span>
            </h1>
            <p className="text-muted-foreground text-xl font-medium max-w-2xl">
              Kelola hak akses dan roles untuk <span className="text-foreground font-bold underline decoration-stone-200 underline-offset-4">pengurus & jamaah</span> masjid Anda.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-14 px-10 font-bold gap-3 shadow-xl shadow-primary/20 text-base">
                <UserPlus className="h-5 w-5" /> Undang Anggota
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] illustrative-card p-10">
              <DialogHeader>
                <DialogTitle className="text-3xl font-display font-bold italic tracking-tight">Undang Anggota</DialogTitle>
                <DialogDescription className="text-lg">Berikan akses spesifik ke dashboard manajemen masjid.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Alamat Email</Label>
                  <Input type="email" required placeholder="pengurus@masjid.org" className="h-14 rounded-xl border-2 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Peran / Role</Label>
                  <Select defaultValue="jamaah">
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="dkm_admin">DKM Admin (Akses Penuh)</SelectItem>
                      <SelectItem value="amil_zakat">Amil Zakat (Modul ZIS)</SelectItem>
                      <SelectItem value="ustadz">Ustadz (Kajian & Forum)</SelectItem>
                      <SelectItem value="jamaah">Jamaah (Hanya Akses Forum)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-stone-50 p-6 rounded-2xl flex gap-4 border-2 border-stone-100">
                  <Shield className="h-6 w-6 text-primary shrink-0" />
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">Anggota akan mendapatkan email aktivasi untuk membuat kata sandi mereka sendiri secara aman.</p>
                </div>
                <Button type="submit" className="w-full h-16 text-lg rounded-full font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">Kirim Undangan Akses</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Main Container (Illustrative Style) */}
      <Card className="illustrative-card overflow-hidden border-none shadow-none hover:shadow-none">
        <div className="p-8 border-b border-stone-100 bg-stone-50/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
            <Input
              placeholder="Cari nama atau email..."
              className="pl-12 h-14 rounded-full border-2 border-stone-200/60 bg-white focus:ring-primary text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-stone-50/50">
              <TableRow className="border-b border-stone-100">
                <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Identitas Jamaah</TableHead>
                <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Peran Sistem</TableHead>
                <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Informasi Kontak</TableHead>
                <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-stone-400 animate-pulse">Menyinkronkan data ummat...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24 opacity-40">
                    <div className="flex flex-col items-center gap-4">
                       <Users className="h-16 w-16" />
                       <p className="text-xl font-display font-bold italic">Anggota tidak ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((member, idx) => (
                    <motion.tr 
                      key={member.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-stone-50 transition-colors border-b border-stone-50 group last:border-none"
                    >
                      <TableCell className="px-10 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-4 border-white shadow-md">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                            <AvatarFallback>{member.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-base tracking-tight">{member.name}</span>
                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
                               <Sparkles className="h-2.5 w-2.5" /> Terverifikasi
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground group-hover:text-slate-600 transition-colors">
                            <Mail className="h-3.5 w-3.5 opacity-40" /> {member.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-10">
                        <Button variant="ghost" size="sm" className="font-black text-[10px] tracking-widest uppercase hover:bg-white hover:shadow-sm rounded-xl px-4 h-9">
                           Kelola Izin
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}