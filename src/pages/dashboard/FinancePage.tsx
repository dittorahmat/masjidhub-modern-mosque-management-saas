import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Wallet, ArrowUpCircle, ArrowDownCircle, Search, FileSpreadsheet, FileText, BrainCircuit } from 'lucide-react';
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
            <h1 className="text-3xl font-display font-bold text-stone-800">Manajemen Keuangan</h1>
            <p className="text-muted-foreground">Pantau arus kas dan kontribusi jamaah.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/app/${slug}/finance/import`}>
              <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white rounded-xl h-10 shadow-sm transition-all">
                <BrainCircuit className="h-4 w-4" /> Impor Mutasi (AI)
              </Button>
            </Link>
            <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
              <Button variant="ghost" size="sm" onClick={() => handleExport('CSV')} className="h-8 gap-1 rounded-lg">
                <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleExport('PDF')} className="h-8 gap-1 rounded-lg">
                <FileText className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl h-10 shadow-lg shadow-emerald-600/10">
                  <PlusCircle className="h-4 w-4" /> Catat Transaksi
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl font-bold">Transaksi Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Tipe Transaksi</Label>
                    <Select name="type" defaultValue="income">
                      <SelectTrigger className="rounded-xl">
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
                    <Input name="amount" type="number" required placeholder="0" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Input name="category" required placeholder="Mis: Infaq Jumat, Listrik" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Input name="description" placeholder="Detail opsional" className="rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl bg-emerald-600" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-widest font-bold text-stone-400">Total Saldo</CardTitle>
              <div className="bg-primary/10 p-2 rounded-xl text-primary"><Wallet className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-stone-800">Rp {(totals.income - totals.expense).toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-widest font-bold text-stone-400">Total Pemasukan</CardTitle>
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><ArrowUpCircle className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-600">Rp {totals.income.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-widest font-bold text-stone-400">Total Pengeluaran</CardTitle>
              <div className="bg-amber-50 p-2 rounded-xl text-amber-600"><ArrowDownCircle className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-amber-600">Rp {totals.expense.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
          <div className="p-6 border-b bg-stone-50/30 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi berdasarkan kategori atau deskripsi..."
                className="pl-11 h-12 rounded-2xl border-stone-200 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-stone-50/50">
                <TableRow>
                  <TableHead className="px-6 h-12 text-[10px] uppercase font-bold text-stone-400">Tanggal</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-bold text-stone-400">Kategori</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-bold text-stone-400">Deskripsi</TableHead>
                  <TableHead className="px-6 h-12 text-[10px] uppercase font-bold text-stone-400 text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-stone-400 animate-pulse">Memuat data transaksi...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-24">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Wallet className="h-16 w-16 text-muted-foreground" />
                        <div className="text-xl font-display font-bold">Belum ada transaksi</div>
                        <p className="text-sm">Catat transaksi pertama atau impor dari mutasi bank.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.sort((a,b) => b.date - a.date).map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-stone-50/50 transition-colors border-stone-100 group">
                      <TableCell className="px-6 py-4 text-xs font-medium text-stone-500">{format(tx.date, 'dd MMM yyyy', { locale: id })}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-6 rounded-full ${tx.type === 'income' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-amber-500 shadow-lg shadow-amber-500/20'}`} />
                          <span className="font-bold text-stone-800 text-sm">{tx.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-stone-500 text-sm italic pr-10">{tx.description}</TableCell>
                      <TableCell className={`px-6 py-4 text-right font-black text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-amber-600'}`}>
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
