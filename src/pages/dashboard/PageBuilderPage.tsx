import React from 'react';
import { useParams } from 'react-router-dom';
import { usePuzzleBuilder } from '@/hooks/features/use-puzzle-builder';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  Eye, 
  Settings2,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  HeartHandshake,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AVAILABLE_SECTIONS = [
  { type: 'hero', name: 'Hero Welcome', icon: Layout, desc: 'Banner utama dengan nama masjid.' },
  { type: 'prayer_times', name: 'Jadwal Shalat', icon: Clock, desc: 'Widget waktu shalat otomatis.' },
  { type: 'donation_progress', name: 'Donasi Aktif', icon: HeartHandshake, desc: 'Progres penggalangan dana.' },
  { type: 'blog_feed', name: 'Kajian Terbaru', icon: MessageSquare, desc: 'Daftar artikel blog terbaru.' },
  { type: 'gallery', name: 'Galeri Foto', icon: ImageIcon, desc: 'Dokumentasi kegiatan masjid.' },
];

export default function PageBuilderPage() {
  const { slug } = useParams();
  const { sections, addSection, removeSection, moveSection, save, isSaving, isLoading } = usePuzzleBuilder(slug || '');

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-2 rounded-xl">
            <Layout className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Puzzle Page Builder</h1>
            <p className="text-xs text-stone-500">Susun portal publik masjid Anda dengan sistem blok.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2 h-10 border-stone-200">
            <Eye className="h-4 w-4" /> Preview Portal
          </Button>
          <Button 
            onClick={save} 
            disabled={isSaving}
            className="rounded-xl gap-2 h-10 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
          >
            <Save className="h-4 w-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Canvas */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 overflow-hidden border-stone-200 rounded-3xl bg-stone-50/50 border-dashed border-2">
            <ScrollArea className="h-full p-6">
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-stone-400">
                  <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <Layout className="h-12 w-12 opacity-20" />
                  </div>
                  <p className="font-medium">Belum ada blok yang ditambahkan</p>
                  <p className="text-sm">Pilih blok dari panel kanan untuk mulai mendesain.</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                  {sections.map((s, index) => (
                    <div 
                      key={s.id} 
                      className="group bg-white border border-stone-200 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                    >
                      <div className="bg-stone-50 p-3 rounded-xl font-bold text-stone-400 text-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-stone-800 capitalize">{s.type.replace('_', ' ')}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-100 bg-emerald-50">Active</Badge>
                        </div>
                        <p className="text-xs text-stone-500">Konfigurasi blok standar MasjidHub.</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400" onClick={() => moveSection(s.id, 'up')}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400" onClick={() => moveSection(s.id, 'down')}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => removeSection(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Sidebar: Available Blocks & Design Guard */}
        <div className="w-80 flex flex-col gap-6">
          <Card className="rounded-2xl border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-600" /> Tambah Blok (Puzzle)
              </CardTitle>
            </CardHeader>
            <ScrollArea className="h-[350px]">
              <div className="p-4 space-y-2">
                {AVAILABLE_SECTIONS.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addSection(item.type)}
                    className="w-full text-left p-3 rounded-xl border border-transparent hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex items-start gap-3 group"
                  >
                    <div className="bg-stone-100 p-2 rounded-lg text-stone-500 group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-800">{item.name}</div>
                      <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Design Guard Panel */}
          <Card className="rounded-2xl border-amber-100 bg-amber-50/20 shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-4 bg-amber-50/50 border-b border-amber-100">
              <CardTitle className="text-xs uppercase tracking-widest font-bold text-amber-800 flex items-center gap-2">
                <Shield className="h-3 w-3" /> Design Guard Active
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase">Tema Warna Masjid</label>
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 border-2 border-white shadow-sm cursor-not-allowed" title="Primary (Locked)" />
                  <div className="h-8 w-8 rounded-full bg-amber-500 border-2 border-white shadow-sm cursor-not-allowed" title="Secondary (Locked)" />
                  <div className="h-8 w-8 rounded-full bg-stone-800 border-2 border-white shadow-sm cursor-not-allowed" title="Dark (Locked)" />
                </div>
                <p className="text-[9px] text-amber-700 leading-relaxed italic">
                  *Pilihan warna dibatasi oleh sistem untuk menjaga estetika profesional MasjidHub.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase">Tipografi</label>
                <div className="p-2 bg-white rounded-lg border border-amber-100 text-xs text-amber-900 font-medium">
                  Inter / Geist (Modern Sans)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
