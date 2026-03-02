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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  FileText, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Plus,
  BrainCircuit,
  Info,
  Sparkles,
  Database,
  Search,
  Loader2
} from 'lucide-react';
import { RoleGallery } from '@/components/features/ai/RoleGallery';
import type { MediaItem, KnowledgeSnippet, Tenant, AIPersona } from '@shared/types';

export default function KnowledgeManagementPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [snippetInput, setSnippetInput] = useState('');

  // Queries
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenants', slug],
    queryFn: () => api<Tenant>(`/api/tenants/${slug}`)
  });

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['knowledge-files', slug],
    queryFn: () => api<MediaItem[]>(`/api/${slug}/knowledge/files`)
  });

  const { data: snippets = [], isLoading: snippetsLoading } = useQuery({
    queryKey: ['knowledge-snippets', slug],
    queryFn: () => api<KnowledgeSnippet[]>(`/api/${slug}/knowledge/snippets`)
  });

  // Mutations
  const updatePersonaMutation = useMutation({
    mutationFn: (persona: AIPersona) => api(`/api/${slug}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ selectedPersona: persona })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', slug] });
      toast.success('Persona AI berhasil diperbarui');
    }
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api(`/api/${slug}/knowledge/upload`, {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files', slug] });
      toast.success('Dokumen diunggah ke memori AI');
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
      toast.success('Pengetahuan baru disimpan');
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <BrainCircuit className="h-8 w-8 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-stone-800">Pusat Kendali AI</h1>
            <p className="text-muted-foreground">Latih memori dan atur karakter asisten digital masjid Anda.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="knowledge" className="space-y-6">
        <TabsList className="bg-stone-100/50 p-1 rounded-xl">
          <TabsTrigger value="knowledge" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Database className="h-4 w-4" /> Memori & Pengetahuan
          </TabsTrigger>
          <TabsTrigger value="persona" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Sparkles className="h-4 w-4" /> Identitas & Peran
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-8 mt-0">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Snippets */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-stone-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-stone-50/50 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Plus className="h-4 w-4 text-emerald-600" /> Informasi Instan
                  </CardTitle>
                  <CardDescription className="text-[11px] leading-relaxed">
                    Tulis info cepat atau atur situs referensi tepercaya AI.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Contoh: Zakat Fitrah tahun ini Rp 45.000 per jiwa."
                      className="min-h-[120px] rounded-xl border-stone-200 bg-white focus-visible:ring-emerald-500"
                      value={snippetInput}
                      onChange={(e) => setSnippetInput(e.target.value)}
                    />
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                        💡 <strong>Situs Terpercaya:</strong> Gunakan format <code className="bg-amber-100 px-1 rounded">REFERENSI: domain.com, domain.id</code> untuk membatasi sumber pencarian AI.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => addSnippetMutation.mutate(snippetInput)}
                    disabled={!snippetInput.trim() || addSnippetMutation.isPending}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  >
                    {addSnippetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Pengetahuan"}
                  </Button>

                  <div className="pt-4 space-y-3">
                    <h4 className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Snippet Aktif</h4>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2 pr-3">
                        {snippetsLoading ? (
                          <div className="text-xs text-stone-400">Memuat...</div>
                        ) : snippets.length === 0 ? (
                          <div className="text-xs text-stone-400 italic">Belum ada data.</div>
                        ) : (
                          snippets.map((s) => (
                            <div key={s.id} className="p-3 bg-white border border-stone-100 rounded-xl shadow-sm text-xs text-stone-700 group relative">
                              <p className="leading-relaxed pr-4">{s.content}</p>
                              <button className="absolute top-2 right-2 text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Knowledge Inbox (PDF) */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-stone-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-white">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-stone-500" /> Knowledge Inbox (PDF)
                    </CardTitle>
                    <CardDescription className="text-xs">Dokumen masjid untuk pemrosesan AI mendalam.</CardDescription>
                  </div>
                  <div className="relative">
                    <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Button variant="secondary" size="sm" className="gap-2 rounded-xl h-9">
                      <Upload className="h-3 w-3" /> Unggah PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-stone-50/50">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-bold">Nama Dokumen</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-right">Tanggal</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filesLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-stone-400">Memuat berkas...</TableCell></TableRow>
                      ) : files.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-12 text-stone-400 italic">Belum ada dokumen diunggah.</TableCell></TableRow>
                      ) : (
                        files.map((f) => (
                          <TableRow key={f.id} className="hover:bg-stone-50/50 transition-colors">
                            <TableCell className="font-medium text-xs truncate max-w-[200px]">{f.fileName}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1 text-[9px] h-5">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Ready
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-[10px] text-stone-500">{new Date(f.createdAt).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-stone-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="persona" className="mt-0">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b py-6 px-8">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" /> Galeri Persona AI
                  </CardTitle>
                  <CardDescription>Pilih identitas asisten digital yang paling sesuai dengan karakter masjid Anda.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <RoleGallery 
                    selected={tenant?.selectedPersona || 'marbot_muda'} 
                    onSelect={(id) => updatePersonaMutation.mutate(id)} 
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1 space-y-6">
              <Card className="rounded-2xl border-cyan-100 bg-cyan-50/30 shadow-sm overflow-hidden">
                <CardHeader className="bg-cyan-50/50 border-b border-cyan-100">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-cyan-900">
                    <Info className="h-4 w-4" /> Apa itu Persona?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 text-xs text-cyan-800 leading-relaxed space-y-3">
                  <p>Persona menentukan <strong>gaya bahasa</strong> dan <strong>fokus jawaban</strong> AI kepada jamaah.</p>
                  <p>Misal: <strong>Ustadz Muda</strong> akan selalu menyertakan dalil, sementara <strong>Marbot Muda</strong> akan fokus pada jadwal dan urusan teknis masjid.</p>
                  <p className="font-bold pt-2">Tips:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Gunakan satu persona secara konsisten.</li>
                    <li>Latih AI di tab "Memori" untuk hasil maksimal sesuai persona.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
