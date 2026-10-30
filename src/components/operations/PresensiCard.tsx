import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface PresensiRecord {
  name: string;
  contact: string;
  date: string;
  attended: boolean;
}

interface PresensiCardProps {
  record: PresensiRecord;
  onToggleAttendance?: () => void;
}

export const PresensiCard: React.FC<PresensiCardProps> = ({
  record,
  onToggleAttendance,
}) => {
  return (
    <Card className="p-4 border border-stone-200/80 shadow-sm rounded-2xl bg-white space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.name}`}
              alt="avatar"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-sm tracking-tight truncate">
              {record.name}
            </h4>
            <p className="text-xs text-muted-foreground truncate">{record.contact}</p>
          </div>
        </div>

        <Badge
          className={`shrink-0 rounded-full px-3 py-0.5 font-black text-[10px] ${
            record.attended
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-stone-100 text-stone-600'
          }`}
        >
          {record.attended ? 'HADIR' : 'ABSEN'}
        </Badge>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
          {record.date}
        </span>
        <Button
          size="sm"
          variant={record.attended ? 'ghost' : 'default'}
          onClick={onToggleAttendance}
          className={`rounded-full font-black h-8 px-4 text-[10px] tracking-wider transition-all ${
            record.attended
              ? 'text-red-500 hover:bg-red-50'
              : 'shadow-sm shadow-primary/10'
          }`}
        >
          {record.attended ? 'BATAL' : 'CHECK-IN'}
        </Button>
      </div>
    </Card>
  );
};
