import React from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Transaction } from '@shared/types';

interface TransactionActionsMenuProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export const TransactionActionsMenu: React.FC<TransactionActionsMenuProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  return (
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
          onClick={() => onEdit(transaction)}
          className="gap-2 cursor-pointer min-h-[44px] font-medium"
        >
          <Pencil className="h-4 w-4 text-emerald-600" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(transaction)}
          className="gap-2 cursor-pointer min-h-[44px] text-destructive focus:text-destructive font-medium"
        >
          <Trash2 className="h-4 w-4 text-rose-600" />
          <span>Hapus</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
