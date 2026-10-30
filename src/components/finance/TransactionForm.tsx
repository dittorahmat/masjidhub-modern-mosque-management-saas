import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TransactionFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, isPending }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5 pt-2">
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Tipe Transaksi</Label>
        <Select name="type" defaultValue="income">
          <SelectTrigger className="h-12 md:h-14 rounded-xl border-2 font-bold focus:ring-emerald-500">
            <SelectValue placeholder="Pilih tipe" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2">
            <SelectItem value="income">Pemasukan (Infaq/Sadaqoh)</SelectItem>
            <SelectItem value="expense">Pengeluaran (Operasional)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Jumlah (Rp)</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-stone-300">Rp</span>
          <Input name="amount" type="number" required placeholder="0" className="h-12 md:h-14 rounded-xl border-2 pl-12 focus:ring-emerald-500 font-black text-lg md:text-xl tracking-tighter" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Kategori</Label>
        <Input name="category" required placeholder="Mis: Infaq Jumat, Listrik" className="h-12 md:h-14 rounded-xl border-2 focus:ring-emerald-500 font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Deskripsi</Label>
        <Input name="description" placeholder="Detail opsional" className="h-12 md:h-14 rounded-xl border-2 focus:ring-emerald-500" />
      </div>
      <Button type="submit" className="w-full h-14 md:h-16 text-base md:text-lg rounded-full font-black bg-emerald-600 hover:bg-emerald-700 mt-4 shadow-xl shadow-emerald-200" disabled={isPending}>
        {isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
      </Button>
    </form>
  );
};
