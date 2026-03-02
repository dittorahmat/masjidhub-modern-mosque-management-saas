import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIPersona } from '@shared/types';
import { cn } from '@/lib/utils';
import { 
  UserRound, 
  GraduationCap, 
  FileText, 
  Rocket, 
  CheckCircle2 
} from 'lucide-react';

interface RoleOption {
  id: AIPersona;
  name: string;
  title: string;
  desc: string;
  icon: any;
  color: string;
  bg: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'marbot_muda',
    name: 'Marbot Muda',
    title: 'The Executor',
    desc: 'Fokus pada logistik, jadwal, dan solusi cepat. Bahasa lugas dan enerjik.',
    icon: UserRound,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    id: 'ustadz_muda',
    name: 'Ustadz Muda',
    title: 'The Mentor',
    desc: 'Fokus pada keilmuan dan dalil. Bahasa santun, bijak, dan akademis.',
    icon: GraduationCap,
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  {
    id: 'sekretaris_digital',
    name: 'Sekretaris Digital',
    title: 'The Administrator',
    desc: 'Fokus pada surat, laporan keuangan, dan SOP. Bahasa formal dan rapi.',
    icon: FileText,
    color: 'text-slate-600',
    bg: 'bg-slate-50'
  },
  {
    id: 'kakak_risma',
    name: 'Kakak RISMA',
    title: 'Youth Mentor',
    desc: 'Fokus pada komunitas pemuda. Bahasa gaul, modern, dan memotivasi.',
    icon: Rocket,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50'
  }
];

interface RoleGalleryProps {
  selected: AIPersona;
  onSelect: (id: AIPersona) => void;
}

export function RoleGallery({ selected, onSelect }: RoleGalleryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ROLES.map((role) => (
        <Card 
          key={role.id}
          className={cn(
            "relative cursor-pointer transition-all duration-300 border-2 overflow-hidden hover:shadow-md",
            selected === role.id 
              ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-lg" 
              : "border-stone-100 hover:border-stone-200"
          )}
          onClick={() => onSelect(role.id)}
        >
          <CardContent className="p-5 flex items-start gap-4">
            <div className={cn("p-3 rounded-2xl", role.bg, role.color)}>
              <role.icon className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-800">{role.name}</h3>
                {selected === role.id && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{role.title}</p>
              <p className="text-xs text-stone-500 leading-relaxed">{role.desc}</p>
            </div>
          </CardContent>
          {selected === role.id && (
            <div className="absolute top-0 right-0">
              <Badge className="rounded-none rounded-bl-xl bg-emerald-500 text-white border-none text-[9px] px-2 py-0.5">Aktif</Badge>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
