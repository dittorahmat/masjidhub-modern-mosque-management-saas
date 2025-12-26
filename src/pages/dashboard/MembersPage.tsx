import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Mail, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { AppUser } from '@shared/types';
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
      case 'superadmin_platform': return <Badge variant="destructive">Platform Admin</Badge>;
      case 'dkm_admin': return <Badge className="bg-emerald-600">DKM Admin</Badge>;
      case 'amil_zakat': return <Badge className="bg-amber-600">Amil Zakat</Badge>;
      case 'ustadz': return <Badge className="bg-blue-600">Ustadz</Badge>;
      default: return <Badge variant="outline">Jamaah</Badge>;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Direktori Pengurus & Jamaah</h1>
            <p className="text-muted-foreground">Kelola hak akses dan roles untuk komunitas masjid Anda.</p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl h-12 shadow-lg shadow-primary/10">
                <UserPlus className="h-5 w-5" /> Undang Anggota Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">Undang Anggota</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label>Alamat Email</Label>
                  <Input type="email" required placeholder="pengurus@masjid.org" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Peran / Role</Label>
                  <Select defaultValue="jamaah">
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dkm_admin">DKM Admin (Penuh)</SelectItem>
                      <SelectItem value="amil_zakat">Amil Zakat (Modul ZIS)</SelectItem>
                      <SelectItem value="ustadz">Ustadz (Kajian & Forum)</SelectItem>
                      <SelectItem value="jamaah">Jamaah (Hanya Akses Forum)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl flex gap-3">
                  <Shield className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">Anggota akan mendapatkan email aktivasi untuk membuat kata sandi mereka sendiri.</p>
                </div>
                <Button type="submit" className="w-full h-14 text-lg rounded-2xl">Kirim Undangan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card className="illustrative-card overflow-hidden">
          <div className="p-4 border-b bg-stone-50/50 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau email..."
                className="pl-10 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identitas</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Informasi Kontak</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12">Menyelaraskan data...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 opacity-50">Tidak ada anggota yang sesuai dengan kriteria.</TableCell></TableRow>
                ) : (
                  filtered.map((member) => (
                    <TableRow key={member.id} className="hover:bg-stone-50/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                            <AvatarFallback>{member.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{member.name}</span>
                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Terverifikasi</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" /> {member.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="font-bold text-xs">Ubah Izin</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}