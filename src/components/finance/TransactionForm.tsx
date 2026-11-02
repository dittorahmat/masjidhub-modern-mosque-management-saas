import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Transaction } from '@shared/types';
import { format } from 'date-fns';

interface TransactionFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending?: boolean;
  initialData?: Transaction | null;
  isEdit?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

// Safely normalize epoch milliseconds or seconds
const safeToDate = (val?: number): Date => {
  if (!val) return new Date();
  const ms = val > 1e11 ? val : val * 1000;
  return new Date(ms);
};

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  isPending,
  initialData,
  isEdit: isEditProp,
  submitLabel,
  onCancel
}) => {
  const isEdit = isEditProp ?? Boolean(initialData);
  // Format as YYYY-MM-DD in local time to avoid UTC day-shift
  const formattedDate = format(safeToDate(initialData?.date), 'yyyy-MM-dd');

  return (
    <form onSubmit={onSubmit} className="space-y-5 pt-2">
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Tipe Transaksi</Label>
        <Select name="type" defaultValue={initialData?.type || "income"}>
          <SelectTrigger className="min-h-[44px] h-12 md:h-14 rounded-xl border-2 font-bold focus:ring-emerald-500">
            <SelectValue placeholder="Pilih tipe" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2">
            <SelectItem value="income">Pemasukan (Infaq/Sadaqoh)</SelectItem>
            <SelectItem value="expense">Pengeluaran (Operasional)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Tanggal</Label>
        <Input
          name="date"
          type="date"
          required
          defaultValue={formattedDate}
          className="min-h-[44px] h-12 md:h-14 rounded-xl border-2 focus:ring-emerald-500 font-bold"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Jumlah (Rp)</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-stone-300">Rp</span>
          <Input
            name="amount"
            type="number"
            required
            placeholder="0"
            defaultValue={initialData?.amount !== undefined ? initialData.amount : ''}
            className="min-h-[44px] h-12 md:h-14 rounded-xl border-2 pl-12 focus:ring-emerald-500 font-black text-lg md:text-xl tracking-tighter"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Kategori</Label>
        <Input
          name="category"
          required
          placeholder="Mis: Infaq Jumat, Listrik"
          defaultValue={initialData?.category || ''}
          className="min-h-[44px] h-12 md:h-14 rounded-xl border-2 focus:ring-emerald-500 font-bold"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Deskripsi</Label>
        <Input
          name="description"
          placeholder="Detail opsional"
          defaultValue={initialData?.description || ''}
          className="min-h-[44px] h-12 md:h-14 rounded-xl border-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="min-h-[44px] flex-1 h-12 md:h-14 rounded-xl font-bold"
          >
            Batal
          </Button>
        )}
        <Button
          type="submit"
          className="min-h-[44px] flex-1 h-12 md:h-14 text-base rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={isPending}
        >
          {isPending
            ? 'Menyimpan...'
            : submitLabel || (isEdit ? 'Perbarui Transaksi' : 'Simpan Transaksi')}
        </Button>
      </div>
    </form>
  );
};
