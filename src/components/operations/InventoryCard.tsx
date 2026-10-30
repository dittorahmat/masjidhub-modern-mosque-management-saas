import React from 'react';
import { Package, MapPin, ClipboardList, History } from 'lucide-react';
import type { InventoryItem } from '@shared/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface InventoryCardProps {
  item: InventoryItem;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ item }) => {
  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'new':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 font-black text-[10px] rounded-full px-2.5 py-0.5">
            BARU
          </Badge>
        );
      case 'good':
        return (
          <Badge className="bg-blue-100 text-blue-700 font-black text-[10px] rounded-full px-2.5 py-0.5">
            BAGUS
          </Badge>
        );
      case 'fair':
        return (
          <Badge className="bg-amber-100 text-amber-700 font-black text-[10px] rounded-full px-2.5 py-0.5">
            CUKUP
          </Badge>
        );
      case 'poor':
        return (
          <Badge className="bg-red-100 text-red-700 font-black text-[10px] rounded-full px-2.5 py-0.5">
            RUSAK
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-black text-[10px] rounded-full">
            {condition.toUpperCase()}
          </Badge>
        );
    }
  };

  return (
    <Card className="p-4 border border-stone-200/80 shadow-sm rounded-2xl bg-white space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-base tracking-tight truncate">
              {item.name}
            </h4>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
              <span>{item.location}</span>
            </p>
          </div>
        </div>

        {getConditionBadge(item.condition)}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="font-bold text-slate-700">Stok: {item.quantity} Unit</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs font-bold text-stone-500 rounded-lg"
          >
            <History className="h-3.5 w-3.5 mr-1" /> Log
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-bold rounded-lg border-stone-200"
          >
            Ubah
          </Button>
        </div>
      </div>
    </Card>
  );
};
