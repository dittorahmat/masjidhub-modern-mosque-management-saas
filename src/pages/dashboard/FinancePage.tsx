import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  FileSpreadsheet,
  FileText,
  BrainCircuit,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { toast } from 'sonner';
import type { Transaction } from '@shared/types';
import { formatRupiah } from '@shared/format';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileFAB } from '@/components/layout/mobile/MobileFAB';
import { TransactionCard } from '@/components/finance/TransactionCard';
import { TransactionForm } from '@/components/finance/TransactionForm';

export default function FinancePage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

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
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal mencatat transaksi');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id: txId, data }: { id: string; data: Partial<Transaction> }) =>
      api(`/api/${slug}/finance/${txId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', slug] });
      toast.success('Transaksi berhasil diperbarui');
      setEditingTransaction(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal memperbarui transaksi');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (txId: string) =>
      api(`/api/${slug}/finance/${txId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', slug] });
      toast.success('Transaksi berhasil dihapus');
      setDeletingTransaction(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal menghapus transaksi');
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
    const dateStr = formData.get('date') as string;
    const dateTimestamp = dateStr ? new Date(dateStr).getTime() : Date.now();

    createMutation.mutate({
      type: formData.get('type') as 'income' | 'expense',
      amount: Number(formData.get('amount')),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      date: dateTimestamp,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTransaction) return;
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get('date') as string;
    const dateTimestamp = dateStr ? new Date(dateStr).getTime() : editingTransaction.date;

    updateMutation.mutate({
      id: editingTransaction.id,
      data: {
        type: formData.get('type') as 'income' | 'expense',
        amount: Number(formData.get('amount')),
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        date: dateTimestamp,
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingTransaction) return;
    deleteMutation.mutate(deletingTransaction.id);
  };

  const handleExport = (type: string) => {
    toast.info(`Mengekspor laporan sebagai ${type}...`, {
      description: "Fitur ini akan segera tersedia secara penuh."
    });
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-16 md:pb-10">
      {/* Refined Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-b border-stone-200/60 pb-8 md:pb-10"
      >
        <div className="space-y-3 md:space-y-4">
          <nav className="flex items-center gap-2 text-muted-foreground/60 font-bold text-[10px] uppercase tracking-[0.3em]">
            <Wallet className="h-3 w-3 text-emerald-500/40" />
            <span>Sistem Keuangan</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-emerald-600/60">Arus Kas Masjid</span>
          </nav>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter italic leading-none">
              Manajemen <span className="text-emerald-600">Keuangan</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-xl font-medium max-w-2xl">
              Pantau <span className="text-foreground font-bold underline decoration-stone-200 underline-offset-4">arus kas</span> dan kontribusi jamaah secara transparan.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <Link to={`/app/${slug}/finance/import`}>
            <Button variant="outline" className="min-h-[44px] rounded-full border-2 h-12 md:h-14 px-6 md:px-8 gap-2 md:gap-3 font-bold transition-all text-sm md:text-base bg-white text-emerald-700">
              <BrainCircuit className="h-4 w-4 md:h-5 md:w-5" /> Impor Mutasi
            </Button>
          </Link>
          <ResponsiveDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <ResponsiveDialogTrigger asChild>
              <Button className="min-h-[44px] rounded-full h-12 md:h-14 px-8 md:px-10 font-bold gap-2 md:gap-3 text-sm md:text-base bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 md:h-5 md:w-5" /> Catat Transaksi
              </Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent className="rounded-t-[2rem] md:rounded-[2.5rem] p-6 md:p-10 max-h-[85vh] overflow-y-auto">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle className="text-2xl md:text-3xl font-display font-bold italic tracking-tight">Transaksi Baru</ResponsiveDialogTitle>
                <ResponsiveDialogDescription className="text-sm md:text-base">Masukkan detail pemasukan atau pengeluaran operasional.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <TransactionForm onSubmit={handleCreate} isPending={createMutation.isPending} onCancel={() => setIsCreateOpen(false)} />
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      </motion.div>

      {/* Standardized Stats with Entrance Animations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <StatCard 
          title="Total Saldo" 
          value={formatRupiah(totals.income - totals.expense)} 
          icon={<Wallet className="h-5 w-5 md:h-6 md:w-6" />} 
          color="primary"
          delay={0.1}
        />
        <StatCard 
          title="Total Pemasukan" 
          value={formatRupiah(totals.income)} 
          icon={<ArrowUpCircle className="h-5 w-5 md:h-6 md:w-6" />} 
          color="emerald"
          delay={0.2}
        />
        <StatCard 
          title="Total Pengeluaran" 
          value={formatRupiah(totals.expense)} 
          icon={<ArrowDownCircle className="h-5 w-5 md:h-6 md:w-6" />} 
          color="amber"
          delay={0.3}
        />
      </div>

      {/* Main Table Container */}
      <Card className="rounded-2xl overflow-hidden border border-stone-200/80 bg-white shadow-none">
        <div className="p-4 md:p-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 bg-stone-50/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-stone-300" />
            <Input
              placeholder="Cari transaksi berdasarkan kategori atau deskripsi..."
              className="pl-11 md:pl-12 min-h-[44px] h-12 md:h-14 rounded-full border-2 border-stone-200/60 bg-white focus:ring-emerald-500 text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-stone-100/80 p-1 rounded-2xl border-2 border-stone-200/40 w-full md:w-auto justify-end">
            <Button variant="ghost" size="sm" onClick={() => handleExport('CSV')} className="min-h-[44px] h-10 gap-1.5 md:gap-2 rounded-xl font-bold px-3 md:px-4 hover:bg-white text-xs md:text-sm">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleExport('PDF')} className="min-h-[44px] h-10 gap-1.5 md:gap-2 rounded-xl font-bold px-3 md:px-4 hover:bg-white text-xs md:text-sm">
              <FileText className="h-4 w-4 text-red-600" /> PDF
            </Button>
          </div>
        </div>

        {/* Mobile View: Stacked Responsive Cards */}
        <div className="block md:hidden p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-stone-400 font-bold">Memuat transaksi...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-stone-400 font-medium">Belum ada transaksi</div>
          ) : (
            filtered
              .sort((a, b) => b.date - a.date)
              .map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onEdit={(t) => setEditingTransaction(t)}
                  onDelete={(t) => setDeletingTransaction(t)}
                />
              ))
          )}
        </div>

        {/* Desktop View: Relational Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-stone-50/50">
              <TableRow className="border-b border-stone-100">
                <TableHead className="px-8 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Tanggal</TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Kategori & Tipe</TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Deskripsi</TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground text-right">Jumlah</TableHead>
                <TableHead className="px-8 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground text-center w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-stone-400 animate-pulse font-bold">Memuat data transaksi...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24">
                    <div className="flex flex-col items-center gap-6 opacity-40">
                      <div className="p-8 bg-stone-50 rounded-[3rem] border-4 border-dashed border-stone-200">
                         <Wallet className="h-20 w-20 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                         <div className="text-2xl font-display font-bold italic tracking-tight">Belum Ada Transaksi</div>
                         <p className="text-sm font-medium">Catat transaksi pertama atau impor dari mutasi bank.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {filtered.sort((a,b) => b.date - a.date).map((tx, idx) => (
                    <motion.tr 
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-stone-50 transition-colors border-b border-stone-100 group last:border-none"
                    >
                      <TableCell className="px-8 py-4 font-bold text-muted-foreground/70">{format(tx.date, 'dd MMM yyyy', { locale: id })}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-6 rounded-full ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-800 text-sm tracking-tight">{tx.category}</span>
                             <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">{tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium italic pr-8 py-4">{tx.description || '-'}</TableCell>
                      <TableCell className={`py-4 text-right font-black text-base tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                      </TableCell>
                      <TableCell className="px-8 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl text-muted-foreground hover:text-foreground"
                              aria-label="Aksi baris transaksi"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem
                              onClick={() => setEditingTransaction(tx)}
                              className="gap-2 cursor-pointer min-h-[40px] font-medium"
                            >
                              <Pencil className="h-4 w-4 text-emerald-600" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingTransaction(tx)}
                              className="gap-2 cursor-pointer min-h-[40px] text-destructive focus:text-destructive font-medium"
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" />
                              <span>Hapus</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Transaction Dialog */}
      <ResponsiveDialog
        open={Boolean(editingTransaction)}
        onOpenChange={(open) => {
          if (!open) setEditingTransaction(null);
        }}
      >
        <ResponsiveDialogContent className="rounded-t-[2rem] md:rounded-[2.5rem] p-6 md:p-10 max-h-[85vh] overflow-y-auto">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="text-2xl md:text-3xl font-display font-bold italic tracking-tight">
              Edit Transaksi
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="text-sm md:text-base">
              Perbarui rincian transaksi kas masjid.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          {editingTransaction && (
            <TransactionForm
              initialData={editingTransaction}
              onSubmit={handleUpdate}
              isPending={updateMutation.isPending}
              onCancel={() => setEditingTransaction(null)}
              submitLabel="Perbarui Transaksi"
            />
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Destructive Delete Confirmation AlertDialog */}
      <AlertDialog
        open={Boolean(deletingTransaction)}
        onOpenChange={(open) => {
          if (!open) setDeletingTransaction(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-xl text-slate-900">
              Hapus Transaksi?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-stone-600">
              Tindakan ini permanen. Transaksi senilai{' '}
              <strong className="text-slate-900">
                {deletingTransaction ? formatRupiah(deletingTransaction.amount) : ''}
              </strong>{' '}
              ({deletingTransaction?.category}) akan dihapus dari buku kas masjid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="min-h-[44px] rounded-xl font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="min-h-[44px] rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Action Button for Mobile */}
      <MobileFAB 
        icon={Plus} 
        label="Tambah Transaksi" 
        onClick={() => setIsCreateOpen(true)} 
      />
    </div>
  );
}

function StatCard({ title, value, icon, color, delay }: any) {
  const colorMap: any = {
    primary: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="p-6 md:p-8 flex flex-col justify-between rounded-2xl bg-white border border-stone-200/80 cursor-default"
    >
       <div className="flex justify-between items-start mb-6 md:mb-8">
          <div className={`p-3 md:p-4 rounded-2xl ${colorMap[color]}`}>
             {icon}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{title}</p>
       </div>
       <div className="space-y-1">
          <p className="text-2xl md:text-3xl font-display font-black tracking-tighter italic text-slate-900 leading-none">{value}</p>
       </div>
    </motion.div>
  );
}
