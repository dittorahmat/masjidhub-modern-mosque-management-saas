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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, MapPin, ClipboardList, ChevronRight, Sparkles, Search, History } from 'lucide-react';
import { toast } from 'sonner';
import type { InventoryItem } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory', slug],
    queryFn: () => api<InventoryItem[]>(`/api/${slug}/inventory`)
  });

  const createMutation = useMutation({
    mutationFn: (newItem: Partial<InventoryItem>) => api(`/api/${slug}/inventory`, {
      method: 'POST',
      body: JSON.stringify(newItem)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', slug] });
      toast.success('Aset berhasil ditambahkan');
      setIsDialogOpen(false);
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      quantity: Number(formData.get('quantity')),
      condition: formData.get('condition') as 'new' | 'good' | 'fair' | 'poor',
      location: formData.get('location') as string,
    });
  };

  const filtered = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'new': return <Badge className="bg-emerald-100 text-emerald-700 font-black text-[10px] rounded-full px-3 py-0.5">BARU</Badge>;
      case 'good': return <Badge className="bg-blue-100 text-blue-700 font-black text-[10px] rounded-full px-3 py-0.5">BAGUS</Badge>;
      case 'fair': return <Badge className="bg-amber-100 text-amber-700 font-black text-[10px] rounded-full px-3 py-0.5">CUKUP</Badge>;
      case 'poor': return <Badge className="bg-red-100 text-red-700 font-black text-[10px] rounded-full px-3 py-0.5">RUSAK</Badge>;
      default: return <Badge variant="outline" className="font-black text-[10px] rounded-full">{condition.toUpperCase()}</Badge>;
    }
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
            <Package className="h-3 w-3 text-primary/40" />
            <span>Manajemen Operasional</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary/60">Inventaris Aset</span>
          </nav>
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter italic leading-none">
              Aset <span className="text-primary">& Inventaris</span>
            </h1>
            <p className="text-muted-foreground text-xl font-medium max-w-2xl">
              Pantau peralatan masjid dan <span className="text-foreground font-bold underline decoration-stone-200 underline-offset-4">kebutuhan pemeliharaan</span> secara berkala.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="relative w-full md:w-72">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
             <Input 
               className="pl-12 rounded-full border-2 h-14 bg-white shadow-sm focus:ring-primary text-base" 
               placeholder="Cari aset..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-14 px-10 font-bold gap-3 shadow-xl shadow-primary/20 text-base">
                <Plus className="h-5 w-5" /> Tambah Aset
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] illustrative-card p-10">
              <DialogHeader>
                <DialogTitle className="text-3xl font-display font-bold italic tracking-tight">Tambah Aset Baru</DialogTitle>
                <DialogDescription className="text-lg">Daftarkan inventaris masjid untuk pelacakan yang lebih baik.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nama Aset</Label>
                  <Input name="name" required placeholder="Mis: Mikrofon Nirkabel Shure" className="h-14 rounded-xl border-2 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Jumlah</Label>
                    <Input name="quantity" type="number" required defaultValue="1" className="h-14 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Kondisi</Label>
                    <Select name="condition" defaultValue="good">
                      <SelectTrigger className="h-14 rounded-xl border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="new">Baru</SelectItem>
                        <SelectItem value="good">Bagus</SelectItem>
                        <SelectItem value="fair">Cukup</SelectItem>
                        <SelectItem value="poor">Rusak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Lokasi Penyimpanan</Label>
                  <Input name="location" required placeholder="Mis: Ruang Pengurus Lt. 1" className="h-14 rounded-xl border-2 font-bold" />
                </div>
                <Button type="submit" className="w-full h-16 text-lg rounded-full font-black bg-primary shadow-xl shadow-primary/20 mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Menambahkan...' : 'Simpan ke Inventaris'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Card key={i} className="h-64 rounded-[2.5rem] animate-pulse bg-stone-100 border-none" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-stone-100 flex flex-col items-center gap-6">
            <div className="p-8 bg-stone-50 rounded-full">
               <Package className="h-16 w-16 text-muted-foreground opacity-20" />
            </div>
            <div className="space-y-1">
               <p className="text-2xl font-display font-bold italic tracking-tight">Tidak Ada Aset</p>
               <p className="text-muted-foreground font-medium">Belum ada data inventaris yang sesuai dengan pencarian Anda.</p>
            </div>
          </div>
        ) : (
          filtered.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -8 }}
            >
              <Card className="illustrative-card h-full flex flex-col group border-none shadow-none hover:shadow-none hover:translate-y-0">
                <CardHeader className="p-8 pb-4 flex flex-row items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-display font-bold italic tracking-tight group-hover:text-primary transition-colors leading-tight">{item.name}</CardTitle>
                    <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary/40" /> {item.location}
                    </p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                    <Package className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-8 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stone-50 rounded-lg"><ClipboardList className="h-4 w-4 text-primary" /></div>
                      <span className="text-sm font-black text-slate-700 tracking-tight">Stok: {item.quantity} Unit</span>
                    </div>
                    {getConditionBadge(item.condition)}
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2 text-stone-500 hover:bg-stone-100 px-4">
                       <History className="h-4 w-4" /> Log
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold border-2 px-6 hover:bg-stone-50">Ubah</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}