import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  FileText, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  BrainCircuit,
  Info
} from 'lucide-react';
import type { MediaItem, KnowledgeSnippet } from '@shared/types';

export default function KnowledgeManagementPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [snippetInput, setSnippetInput] = useState('');

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['knowledge-files', slug],
    queryFn: () => api<MediaItem[]>(`/api/${slug}/knowledge/files`)
  });

  const { data: snippets = [], isLoading: snippetsLoading } = useQuery({
    queryKey: ['knowledge-snippets', slug],
    queryFn: () => api<KnowledgeSnippet[]>(`/api/${slug}/knowledge/snippets`)
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api(`/api/${slug}/knowledge/upload`, {
        method: 'POST',
        body: formData,
        headers: {} // Fetch handles boundary for FormData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files', slug] });
      toast.success('Dokumen berhasil diunggah ke Inbox');
    }
  });

  const addSnippetMutation = useMutation({
    mutationFn: (content: string) => 
      api(`/api/${slug}/knowledge/snippets`, {
        method: 'POST',
        body: JSON.stringify({ content, priority: 1 })
      }),
    onSuccess: () => {
      setSnippetInput('');
      queryClient.invalidateQueries({ queryKey: ['knowledge-snippets', slug] });
      toast.success('Informasi dinamis berhasil disimpan');
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Manajemen Pengetahuan AI</h1>
          <p className="text-muted-foreground">Latih asisten digital masjid Anda dengan data lokal.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 rounded-xl">
            <Info className="h-4 w-4" /> Bantuan
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Snippets */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-emerald-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-emerald-50/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-800">
                <Plus className="h-4 w-4" /> Quick Knowledge Snippets
              </CardTitle>
              <CardDescription className="text-xs">
                Masukkan informasi singkat yang berubah-ubah (misal: nominal zakat, info darurat).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Textarea 
                placeholder="Tulis informasi di sini... (e.g. Zakat Fitrah tahun ini adalah Rp 45.000)"
                className="min-h-[120px] rounded-xl border-stone-200 bg-stone-50/50 focus-visible:ring-emerald-500"
                value={snippetInput}
                onChange={(e) => setSnippetInput(e.target.value)}
              />
              <Button 
                onClick={() => addSnippetMutation.mutate(snippetInput)}
                disabled={!snippetInput.trim() || addSnippetMutation.isPending}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
              >
                {addSnippetMutation.isPending ? "Menyimpan..." : "Simpan Pengetahuan"}
              </Button>

              <div className="pt-4 space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Snippet Aktif</h4>
                {snippetsLoading ? (
                  <div className="text-xs text-stone-400">Memuat...</div>
                ) : snippets.length === 0 ? (
                  <div className="text-xs text-stone-400 italic">Belum ada snippet aktif.</div>
                ) : (
                  snippets.map((s) => (
                    <div key={s.id} className="p-3 bg-white border border-stone-100 rounded-xl shadow-sm text-xs text-stone-700 flex justify-between items-start gap-2">
                      <p className="leading-relaxed">{s.content}</p>
                      <button className="text-stone-300 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Knowledge Inbox (PDF) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-stone-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-white">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-stone-500" /> Knowledge Inbox (PDF)
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar dokumen masjid yang diunggah untuk pemrosesan AI mendalam.
                </CardDescription>
              </div>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  id="pdf-upload"
                />
                <Button variant="secondary" className="gap-2 rounded-xl text-xs h-9">
                  <Upload className="h-3 w-3" /> Unggah PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-stone-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold w-[300px]">Nama Dokumen</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Status AI</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-right">Tanggal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filesLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-stone-400">Memuat berkas...</TableCell></TableRow>
                  ) : files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-stone-400">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 opacity-20" />
                          <p>Belum ada dokumen diunggah.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    files.map((f) => (
                      <TableRow key={f.id} className="hover:bg-stone-50/50 transition-colors">
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            {f.fileName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1 text-[10px] h-5">
                            <CheckCircle2 className="h-3 w-3" /> Ready
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-[10px] text-stone-500">
                          {new Date(f.createdAt).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-300 hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* AI Training Insight */}
          <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 flex items-start gap-4">
            <div className="bg-cyan-100 p-2 rounded-full text-cyan-700 mt-1">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-cyan-900">Tips Melatih AI</h4>
              <p className="text-xs text-cyan-800 leading-relaxed mt-1">
                Gunakan PDF untuk dokumen statis panjang seperti AD/ART atau buku panduan masjid. 
                Gunakan Quick Snippets untuk info yang sering berubah agar respon AI selalu segar tanpa menunggu pemrosesan file besar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
