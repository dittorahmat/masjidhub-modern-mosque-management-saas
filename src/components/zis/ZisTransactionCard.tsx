import React from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale/id';
import { ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import type { ZisTransaction } from '@shared/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ZisTransactionCardProps {
  transaction: ZisTransaction;
}

export const ZisTransactionCard: React.FC<ZisTransactionCardProps> = ({ transaction }) => {
  const isIncoming = transaction.flow === 'in';
  const isCompleted = transaction.payment_status === 'completed';

  return (
    <Card className="p-4 border border-stone-200/80 shadow-sm rounded-2xl bg-white space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isIncoming
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isIncoming ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : (
              <ArrowDownRight className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-sm tracking-tight truncate flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="truncate">
                {transaction.muzakki_name || transaction.mustahik_id || 'Ummat'}
              </span>
            </h4>
            <p className="text-[11px] font-medium text-muted-foreground/80">
              {format(transaction.date, 'dd MMM yyyy', { locale: localeId })}
            </p>
          </div>
        </div>

        <Badge
          className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isCompleted
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isCompleted ? 'SELESAI' : 'PROSES'}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs">
        <Badge
          variant="outline"
          className="capitalize border-stone-200 bg-stone-50 font-bold text-[10px] px-2.5 py-0.5"
        >
          {transaction.type.replace('_', ' ')}
        </Badge>
        <span className="text-[11px] font-medium text-stone-500">
          {isIncoming ? 'Penerimaan' : 'Penyaluran'}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Jumlah
        </span>
        <span
          className={`text-base font-black tracking-tight ${
            isIncoming ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {isIncoming ? '+' : '-'} Rp {transaction.amount.toLocaleString('id-ID')}
        </span>
      </div>
    </Card>
  );
};
