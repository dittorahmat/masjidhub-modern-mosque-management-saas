import React from 'react';
import { User, Phone, CheckCircle2, MoreVertical } from 'lucide-react';
import type { Mustahik } from '@shared/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MustahikCardProps {
  mustahik: Mustahik;
}

export const MustahikCard: React.FC<MustahikCardProps> = ({ mustahik }) => {
  const isCompleted = mustahik.status === 'completed';

  return (
    <Card className="p-4 border border-stone-200/80 shadow-sm rounded-2xl bg-white space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 text-stone-600">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-base tracking-tight truncate">
              {mustahik.name}
            </h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              <Phone className="h-3.5 w-3.5 opacity-40 shrink-0" />
              <span>{mustahik.phone || 'No. HP tidak ada'}</span>
            </p>
          </div>
        </div>

        <Badge className="bg-slate-900 text-white capitalize font-black tracking-wider text-[10px] px-2.5 py-0.5 rounded-full shrink-0">
          {mustahik.category}
        </Badge>
      </div>

      {mustahik.address && (
        <p className="text-xs text-stone-600 truncate bg-stone-50/60 p-2 rounded-lg border border-stone-100">
          {mustahik.address}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
          <CheckCircle2
            className={`h-4 w-4 ${
              isCompleted ? 'text-emerald-500' : 'text-stone-300'
            }`}
          />
          <span className={isCompleted ? 'text-emerald-700' : 'text-stone-500'}>
            {isCompleted ? 'Terbantu' : 'Menunggu'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-stone-100 h-8 w-8 text-stone-500"
          aria-label="Aksi Mustahik"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
