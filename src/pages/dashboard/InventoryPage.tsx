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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, MapPin, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import type { InventoryItem } from '@shared/types';
export default function InventoryPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'new': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Baru</Badge>;
      case 'good': return <Badge className="bg-blue-500 hover:bg-blue-600">Bagus</Badge>;
      case 'fair': return <Badge className="bg-amber-500 hover:bg-amber-600">Cukup</Badge>;
      case 'poor': return <Badge variant="destructive">Rusak</Badge>;
      default: return <Badge variant="outline">{condition}</Badge>;
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Inventaris & Aset</h1>
            <p className="text-muted-foreground">Pantau peralatan masjid dan kebutuhan pemeliharaan.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Tambah Aset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Aset Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nama Aset</Label>
                  <Input name="name" required placeholder="Mis: Mikrofon Nirkabel" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jumlah</Label>
                    <Input name="quantity" type="number" required defaultValue="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kondisi</Label>
                    <Select name="condition" defaultValue="good">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Baru</SelectItem>
                        <SelectItem value="good">Bagus</SelectItem>
                        <SelectItem value="fair">Cukup</SelectItem>
                        <SelectItem value="poor">Rusak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lokasi</Label>
                  <Input name="location" required placeholder="Mis: Ruang Penyimpanan A" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Menambahkan...' : 'Tambah ke Inventaris'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Card key={i} className="h-48 animate-pulse bg-stone-100" />)
          ) : inventory.length === 0 ? (
            <div className="col-span-full py-20 text-center illustrative-card">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">Tidak ada aset ditemukan.</p>
            </div>
          ) : (
            inventory.map((item) => (
              <Card key={item.id} className="illustrative-card">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.location}
                    </p>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Jumlah: {item.quantity}</span>
                    </div>
                    {getConditionBadge(item.condition)}
                  </div>
                  <div className="pt-2 border-t flex justify-end gap-2">
                    <Button variant="ghost" size="sm">Riwayat</Button>
                    <Button variant="outline" size="sm">Ubah</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}