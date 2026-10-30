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
import { Input } from '@/components/ui/input';
import { Plus, PlusCircle, Wallet, ArrowUpCircle, ArrowDownCircle, Search, FileSpreadsheet, FileText, BrainCircuit, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { toast } from 'sonner';
import type { Transaction } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileFAB } from '@/components/layout/mobile/MobileFAB';
import { TransactionCard } from '@/components/finance/TransactionCard';
import { TransactionForm } from '@/components/finance/TransactionForm';

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
    <div className="space-y-8 md:space-y-12 pb-16 md:pb-10">
      {/* Refined Header (Editorial Style) */}
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
            <Button variant="outline" className="rounded-full border-2 h-12 md:h-14 px-6 md:px-8 gap-2 md:gap-3 font-bold shadow-sm hover:shadow-md transition-all text-sm md:text-base bg-white text-emerald-700">
              <BrainCircuit className="h-4 w-4 md:h-5 md:w-5" /> Impor Mutasi
            </Button>
          </Link>
          <ResponsiveDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <ResponsiveDialogTrigger asChild>
              <Button className="rounded-full h-12 md:h-14 px-8 md:px-10 font-bold gap-2 md:gap-3 shadow-xl shadow-primary/20 text-sm md:text-base">
                <PlusCircle className="h-4 w-4 md:h-5 md:w-5" /> Catat Transaksi
              </Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent className="rounded-t-[2rem] md:rounded-[2.5rem] illustrative-card p-6 md:p-10 max-h-[85vh] overflow-y-auto">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle className="text-2xl md:text-3xl font-display font-bold italic tracking-tight">Transaksi Baru</ResponsiveDialogTitle>
                <ResponsiveDialogDescription className="text-sm md:text-base">Masukkan detail pemasukan atau pengeluaran operasional.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <TransactionForm onSubmit={handleCreate} isPending={createMutation.isPending} />
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      </motion.div>

      {/* Standardized Stats with Entrance Animations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <StatCard 
          title="Total Saldo" 
          value={`Rp ${(totals.income - totals.expense).toLocaleString('id-ID')}`} 
          icon={<Wallet className="h-5 w-5 md:h-6 md:w-6" />} 
          color="primary"
          delay={0.1}
        />
        <StatCard 
          title="Total Pemasukan" 
          value={`Rp ${totals.income.toLocaleString('id-ID')}`} 
          icon={<ArrowUpCircle className="h-5 w-5 md:h-6 md:w-6" />} 
          color="emerald"
          delay={0.2}
        />
        <StatCard 
          title="Total Pengeluaran" 
          value={`Rp ${totals.expense.toLocaleString('id-ID')}`} 
          icon={<ArrowDownCircle className="h-5 w-5 md:h-6 md:w-6" />} 
          color="amber"
          delay={0.3}
        />
      </div>

      {/* Main Table Container (Illustrative Style) */}
      <Card className="illustrative-card overflow-hidden border-none shadow-none hover:shadow-none">
        <div className="p-4 md:p-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 bg-stone-50/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-stone-300" />
            <Input
              placeholder="Cari transaksi berdasarkan kategori atau deskripsi..."
              className="pl-11 md:pl-12 h-12 md:h-14 rounded-full border-2 border-stone-200/60 bg-white focus:ring-emerald-500 text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-stone-100/80 p-1 rounded-2xl border-2 border-stone-200/40 w-full md:w-auto justify-end">
            <Button variant="ghost" size="sm" onClick={() => handleExport('CSV')} className="h-9 md:h-10 gap-1.5 md:gap-2 rounded-xl font-bold px-3 md:px-4 hover:bg-white hover:shadow-sm text-xs md:text-sm">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleExport('PDF')} className="h-9 md:h-10 gap-1.5 md:gap-2 rounded-xl font-bold px-3 md:px-4 hover:bg-white hover:shadow-sm text-xs md:text-sm">
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
              .map((tx) => <TransactionCard key={tx.id} transaction={tx} />)
          )}
        </div>

        {/* Desktop View: Relational Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-stone-50/50">
              <TableRow className="border-b border-stone-100">
                <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Tanggal</TableHead>
                <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Kategori & Tipe</TableHead>
                <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Deskripsi</TableHead>
                <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 text-stone-400 animate-pulse font-bold">Memuat data transaksi...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24">
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
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-stone-50 transition-colors border-b border-stone-50 group last:border-none"
                    >
                      <TableCell className="px-10 py-5 font-bold text-muted-foreground/70">{format(tx.date, 'dd MMM yyyy', { locale: id })}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-6 rounded-full ${tx.type === 'income' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-amber-500 shadow-lg shadow-amber-500/20'}`} />
                          <div className="flex flex-col">
                             <span className="font-black text-slate-800 text-sm tracking-tight">{tx.category}</span>
                             <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">{tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium italic pr-10">{tx.description}</TableCell>
                      <TableCell className={`px-10 py-5 text-right font-black text-lg tracking-tighter ${tx.type === 'income' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Floating Action Button for Mobile */}
      <MobileFAB 
        icon={Plus} 
        label="Tambah Transaksi" 
        onClick={() => setIsDialogOpen(true)} 
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
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="illustrative-card p-6 md:p-8 flex flex-col justify-between group cursor-default"
    >
       <div className="flex justify-between items-start mb-6 md:mb-8">
          <div className={`p-3 md:p-4 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300 ${colorMap[color].split(' ')[1]}`}>
             {icon}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{title}</p>
       </div>
       <div className="space-y-1">
          <p className="text-2xl md:text-4xl font-display font-black tracking-tighter italic text-slate-900 leading-none">{value}</p>
       </div>
    </motion.div>
  );
}
