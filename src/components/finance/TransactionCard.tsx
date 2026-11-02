import React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { ArrowUpRight, ArrowDownRight, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { Transaction } from '@shared/types';
import { formatRupiah } from '@shared/format';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const isIncome = transaction.type === 'income';

  return (
    <Card className="p-4 border border-stone-200/80 rounded-2xl bg-white space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isIncome
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isIncome ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : (
              <ArrowDownRight className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-sm tracking-tight truncate">
              {transaction.category}
            </h4>
            <p className="text-[11px] font-medium text-muted-foreground/80">
              {format(transaction.date, 'dd MMM yyyy', { locale: id })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant="outline"
            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isIncome
                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700'
                : 'border-rose-200 bg-rose-50/50 text-rose-700'
            }`}
          >
            {isIncome ? 'Masuk' : 'Keluar'}
          </Badge>

          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] h-11 w-11 text-muted-foreground hover:text-foreground rounded-xl"
                  aria-label="Opsi transaksi"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(transaction)}
                    className="gap-2 cursor-pointer min-h-[40px] font-medium"
                  >
                    <Pencil className="h-4 w-4 text-emerald-600" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(transaction)}
                    className="gap-2 cursor-pointer min-h-[40px] text-destructive focus:text-destructive font-medium"
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                    <span>Hapus</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {transaction.description && (
        <p className="text-xs text-stone-600 line-clamp-2 italic bg-stone-50/60 p-2 rounded-lg border border-stone-100">
          {transaction.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Nominal
        </span>
        <span
          className={`text-base font-black tracking-tight ${
            isIncome ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {isIncome ? '+' : '-'} {formatRupiah(transaction.amount)}
        </span>
      </div>
    </Card>
  );
};
