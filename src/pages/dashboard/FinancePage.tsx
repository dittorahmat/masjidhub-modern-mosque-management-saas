import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Wallet, ArrowUpCircle, ArrowDownCircle, Search, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { toast } from 'sonner';
import type { Transaction } from '@shared/types';
export default function FinancePage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['finance', slug],
    queryFn: () => api<Transaction[]>(`/api/${slug}/finance`)
  });
  const createMutation = useMutation({
    mutationFn: (newTx: Partial<Transaction>) => api(`/api/${slug}/finance`, {
      method: 'POST',
      body: JSON.stringify(newTx)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', slug] });
      toast.success('Transaksi berhasil dicatat');
      setIsDialogOpen(false);
    }
  });
  const totals = transactions.reduce((acc, tx) => {
    if (tx.type === 'income') acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });
  const filtered = transactions.filter(t =>
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      type: formData.get('type') as 'income' | 'expense',
      amount: Number(formData.get('amount')),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      date: Date.now(),
    });
  };
  const handleExport = (type: string) => {
    toast.info(`Mengekspor laporan sebagai ${type}...`, {
      description: "Fitur ini akan segera tersedia secara penuh."
    });
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Manajemen Keuangan</h1>
            <p className="text-muted-foreground">Pantau arus kas dan kontribusi jamaah.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-lg">
              <Button variant="ghost" size="sm" onClick={() => handleExport('CSV')} className="h-8 gap-1">
                <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleExport('PDF')} className="h-8 gap-1">
                <FileText className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" /> Catat Transaksi
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Transaksi Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Tipe Transaksi</Label>
                    <Select name="type" defaultValue="income">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Pemasukan (Infaq/Sadaqoh)</SelectItem>
                        <SelectItem value="expense">Pengeluaran (Operasional)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jumlah (Rp)</Label>
                    <Input name="amount" type="number" required placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Input name="category" required placeholder="Mis: Infaq Jumat, Listrik" />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Input name="description" placeholder="Detail opsional" />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="illustrative-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {(totals.income - totals.expense).toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card className="illustrative-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">Rp {totals.income.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card className="illustrative-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">Rp {totals.expense.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
        </div>
        <Card className="illustrative-card overflow-hidden">
          <div className="p-4 border-b bg-stone-50/50 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Memuat...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <Wallet className="h-12 w-12 text-muted-foreground" />
                        <div className="text-lg font-display">Belum ada transaksi</div>
                        <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                          Mulai Pencatatan Pertama
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.sort((a,b) => b.date - a.date).map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                      <TableCell>{format(tx.date, 'dd MMM yyyy', { locale: id })}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-6 rounded-full ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="font-medium">{tx.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{tx.description}</TableCell>
                      <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
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