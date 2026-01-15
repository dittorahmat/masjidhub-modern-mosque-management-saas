import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, Plus, Trash2, Edit2, MoveVertical, 
  Camera, Landmark, Sparkles, Instagram, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import type { OrganizationMember } from '@shared/types';

export default function OrganizationPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['org-members', slug],
    queryFn: () => api<OrganizationMember[]>(`/api/${slug}/organization`)
  });

  const createMutation = useMutation({
    mutationFn: (newMember: Partial<OrganizationMember>) => api(`/api/${slug}/organization`, {
      method: 'POST',
      body: JSON.stringify(newMember)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', slug] });
      toast.success('Pengurus berhasil ditambahkan');
      setIsDialogOpen(false);
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      order: Number(formData.get('order') || 0),
      imageUrl: formData.get('imageUrl') as string,
      bio: formData.get('bio') as string,
    });
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Users className="h-4 w-4" />
            <span>Manajemen Internal</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight italic">
            Struktur <span className="text-primary">Organisasi</span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Kelola profil pengurus DKM untuk ditampilkan di <span className="text-foreground font-bold">Portal Publik</span>.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-8 font-bold gap-2 shadow-xl shadow-primary/20">
              <Plus className="h-4 w-4" /> Tambah Pengurus
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Data Pengurus Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 rounded-full bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                   <Camera className="h-8 w-8 text-stone-400 group-hover:text-primary transition-colors" />
                   <Input name="imageUrl" className="absolute inset-0 opacity-0 cursor-pointer" type="url" placeholder="URL Foto" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input name="name" required placeholder="Contoh: H. Ahmad Sulaiman" className="h-12 rounded-xl border-2" />
              </div>
              <div className="space-y-2">
                <Label>Jabatan</Label>
                <Input name="role" required placeholder="Contoh: Ketua DKM / Bendahara" className="h-12 rounded-xl border-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Urutan Tampil</Label>
                  <Input name="order" type="number" defaultValue="0" className="h-12 rounded-xl border-2" />
                </div>
                <div className="space-y-2">
                  <Label>Bio Singkat</Label>
                  <Input name="bio" placeholder="Khidmat sejak 2020" className="h-12 rounded-xl border-2" />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 text-lg rounded-2xl font-bold bg-primary shadow-lg mt-4" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan Data Pengurus'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Card key={i} className="h-64 rounded-[2rem] animate-pulse bg-stone-50" />)
        ) : members.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-stone-200">
             <Landmark className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-10" />
             <p className="text-xl font-bold text-muted-foreground">Belum ada pengurus yang didaftarkan.</p>
          </div>
        ) : (
          members.sort((a,b) => a.order - b.order).map((member) => (
            <Card key={member.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
               <div className="h-48 bg-stone-100 flex items-center justify-center overflow-hidden">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Users className="h-16 w-16 text-stone-300" />
                  )}
               </div>
               <CardContent className="p-6 text-center space-y-2">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <Badge variant="outline" className="rounded-full px-4 border-primary/20 text-primary font-bold uppercase text-[10px]">
                    {member.role}
                  </Badge>
                  <p className="text-sm text-muted-foreground font-medium pt-2 italic">"{member.bio || 'Melayani Ummat'}"</p>
                  <div className="flex justify-center gap-2 pt-4">
                     <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 hover:text-primary"><Edit2 className="h-4 w-4" /></Button>
                     <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </div>
               </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
