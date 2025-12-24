import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, History, HeartPulse, User, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ZisTransaction } from '@shared/types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale/id';
export default function ZisPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['zis', slug],
    queryFn: () => api<ZisTransaction[]>(`/api/${slug}/zis`)
  });
  const createMutation = useMutation({
    mutationFn: (newTx: Partial<ZisTransaction>) => api(`/api/${slug}/zis`, {
      method: 'POST',
      body: JSON.stringify(newTx)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zis', slug] });
      toast.success('Penerimaan ZIS berhasil dicatat');
      setIsDialogOpen(false);
    }
  });
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      type: formData.get('type') as any,
      amount: Number(formData.get('amount')),
      muzakki_name: formData.get('muzakki_name') as string,
      description: formData.get('description') as string,
      flow: 'in'
    });
  };
  const totals = transactions.reduce((acc, tx) => {
    if (tx.flow === 'in') acc[tx.type] = (acc[tx.type] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Modul ZIS</h1>
          <p className="text-muted-foreground">Pengelolaan Zakat, Infaq, dan Shadaqah yang amanah.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl h-12 shadow-lg shadow-emerald-200">
                <PlusCircle className="h-4 w-4" /> Penerimaan ZIS
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Catat Penerimaan ZIS</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Tipe ZIS</Label>
                  <Select name="type" defaultValue="zakat_fitrah">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zakat_fitrah">Zakat Fitrah</SelectItem>
                      <SelectItem value="zakat_maal">Zakat Maal</SelectItem>
                      <SelectItem value="fidyah">Fidyah</SelectItem>
                      <SelectItem value="infaq_shadaqah">Infaq & Shadaqah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nama Muzakki (Pemberi)</Label>
                  <Input name="muzakki_name" required placeholder="Nama Lengkap" />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah (Rp)</Label>
                  <Input name="amount" type="number" required placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Keterangan</Label>
                  <Input name="description" placeholder="Catatan tambahan" />
                </div>
                <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ZisStatCard
          title="Zakat Fitrah"
          value={totals.zakat_fitrah || 0}
          icon={<HeartPulse className="text-emerald-600" />}
          color="bg-emerald-50 border-emerald-100"
        />
        <ZisStatCard
          title="Zakat Maal"
          value={totals.zakat_maal || 0}
          icon={<Wallet className="text-amber-600" />}
          color="bg-amber-50 border-amber-100"
        />
        <ZisStatCard
          title="Infaq & Shadaqah"
          value={totals.infaq_shadaqah || 0}
          icon={<User className="text-blue-600" />}
          color="bg-blue-50 border-blue-100"
        />
      </div>
      <Card className="illustrative-card overflow-hidden">
        <CardHeader className="bg-stone-50/50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Riwayat Penerimaan Terkini
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Muzakki</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 opacity-50 italic">
                    Belum ada data transaksi ZIS.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.sort((a,b) => b.date - a.date).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(tx.date, 'dd MMM yyyy', { locale: localeId })}</TableCell>
                    <TableCell className="font-bold">{tx.muzakki_name || 'Hamba Allah'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      Rp {tx.amount.toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
function ZisStatCard({ title, value, icon, color }: any) {
  return (
    <Card className={`illustrative-card ${color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-70 flex justify-between items-center">
          {title}
          {icon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-display font-bold">Rp {value.toLocaleString('id-ID')}</div>
      </CardContent>
    </Card>
  );
}