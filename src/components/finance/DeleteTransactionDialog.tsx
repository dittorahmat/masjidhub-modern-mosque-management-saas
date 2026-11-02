import React from 'react';
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
import type { Transaction } from '@shared/types';
import { formatRupiah } from '@shared/format';

interface DeleteTransactionDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export const DeleteTransactionDialog: React.FC<DeleteTransactionDialogProps> = ({
  transaction,
  isOpen,
  onOpenChange,
  onConfirm,
  isPending,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-bold text-xl text-slate-900">
            Hapus Transaksi?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-stone-600">
            Tindakan ini permanen. Transaksi senilai{' '}
            <strong className="text-slate-900">
              {transaction ? formatRupiah(transaction.amount) : ''}
            </strong>{' '}
            ({transaction?.category}) akan dihapus dari buku kas masjid.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel
            disabled={isPending}
            className="min-h-[44px] rounded-xl font-bold"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="min-h-[44px] rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isPending ? 'Menghapus...' : 'Ya, Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
