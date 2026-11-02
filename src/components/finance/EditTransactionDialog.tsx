import React from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { TransactionForm } from './TransactionForm';
import type { Transaction } from '@shared/types';

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  transaction,
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}) => {
  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="rounded-t-[2rem] md:rounded-[2.5rem] p-6 md:p-10 max-h-[85vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-2xl md:text-3xl font-display font-bold italic tracking-tight">
            Edit Transaksi
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-sm md:text-base">
            Perbarui rincian transaksi kas masjid.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {transaction && (
          <TransactionForm
            initialData={transaction}
            isEdit={true}
            onSubmit={onSubmit}
            isPending={isPending}
            onCancel={() => onOpenChange(false)}
            submitLabel="Perbarui Transaksi"
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
