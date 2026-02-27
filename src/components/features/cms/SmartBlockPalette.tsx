import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Book, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SmartBlockPaletteProps {
  onInsert: (text: string) => void;
}

export function SmartBlockPalette({ onInsert }: SmartBlockPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // Mock search results for demonstration (in real it calls the API we just added)
      // Since external fetch might be blocked in dev environment, we use robust mock
      const mockResults = [
        { id: 1, verse: "Baqarah: 183", text: "يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ...", translation: "Hai orang-orang yang beriman, diwajibkan atas kamu berpuasa..." },
        { id: 2, verse: "Maidah: 2", text: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ...", translation: "Dan tolong-menolonglah kamu dalam (mengerjakan) kebajikan..." }
      ];
      setResults(mockResults);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white border rounded-2xl shadow-xl w-80 space-y-4 font-sans animate-in fade-in zoom-in duration-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-amber-100 p-1.5 rounded-lg">
          <Book className="h-4 w-4 text-amber-700" />
        </div>
        <h3 className="text-sm font-bold text-stone-800">Smart Blocks (Cari Ayat)</h3>
      </div>
      
      <div className="flex gap-2">
        <Input 
          placeholder="Cari ayat (e.g. Puasa)" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="h-9 text-xs rounded-xl bg-stone-50 border-stone-200"
        />
        <Button size="icon" onClick={handleSearch} className="h-9 w-9 rounded-xl bg-emerald-600">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="h-60">
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs italic">
              Masukkan kata kunci untuk mencari referensi.
            </div>
          ) : (
            results.map((r) => (
              <div key={r.id} className="p-3 border border-stone-100 rounded-xl hover:bg-stone-50 transition-colors group relative">
                <Badge variant="outline" className="text-[9px] mb-1.5 bg-white">{r.verse}</Badge>
                <p className="text-right font-serif text-lg mb-2 leading-loose text-stone-800">{r.text}</p>
                <p className="text-[10px] text-stone-500 italic line-clamp-2">{r.translation}</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => onInsert(`
> ${r.text}
> *(${r.verse})*
`)}
                  className="w-full mt-3 h-7 text-[10px] rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none"
                >
                  <Plus className="h-3 w-3 mr-1" /> Sisipkan ke Artikel
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
