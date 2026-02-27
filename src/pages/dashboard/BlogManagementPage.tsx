import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Plus, 
  Save, 
  Eye, 
  Search, 
  MessageSquare, 
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { SmartBlockPalette } from '@/components/features/cms/SmartBlockPalette';
import type { BlogPost } from '@shared/types';

export default function BlogManagementPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts', slug],
    queryFn: () => api<BlogPost[]>(`/api/${slug}/blog`)
  });

  const createMutation = useMutation({
    mutationFn: (newPost: Partial<BlogPost>) => 
      api(`/api/${slug}/blog`, {
        method: 'POST',
        body: JSON.stringify(newPost)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts', slug] });
      toast.success('Artikel berhasil dipublikasikan');
      setIsCreating(false);
      setTitle('');
      setContent('');
    },
    onError: () => toast.error('Gagal mempublikasikan artikel')
  });

  const handleInsertSmartBlock = (text: string) => {
    setContent(prev => prev + text);
    setShowPalette(false);
    toast.info('Referensi Ayat disisipkan');
  };

  if (isCreating) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg text-stone-800">Tulis Kajian Baru</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl gap-2 h-10 border-stone-200">
              <Eye className="h-4 w-4" /> Pratinjau
            </Button>
            <Button 
              onClick={() => createMutation.mutate({ title, content, authorId: 'admin', slug: title.toLowerCase().replace(/ /g, '-'), status: 'published' })}
              disabled={createMutation.isPending || !title || !content}
              className="rounded-xl gap-2 h-10 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
            >
              <Save className="h-4 w-4" /> Publikasi
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="lg:col-span-3 space-y-4">
            <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <Input 
                  placeholder="Judul Kajian / Artikel..." 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-3xl font-bold border-none px-0 focus-visible:ring-0 placeholder:text-stone-200 h-auto"
                />
                <div className="h-px bg-stone-100 w-full" />
                <Textarea 
                  placeholder="Mulai menulis di sini..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[500px] border-none px-0 focus-visible:ring-0 text-lg leading-relaxed placeholder:text-stone-200 resize-none"
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-6">
              <Card className="rounded-2xl border-amber-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-amber-50/50 border-b border-amber-100 py-4 px-5">
                  <CardTitle className="text-xs uppercase tracking-widest font-bold text-amber-800 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> AI Smart Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="relative">
                    <Button 
                      onClick={() => setShowPalette(!showPalette)}
                      className="w-full justify-start gap-3 rounded-xl h-12 bg-white border border-amber-200 text-stone-700 hover:bg-amber-50 transition-colors shadow-sm"
                    >
                      <div className="bg-amber-100 p-1.5 rounded-lg text-amber-700">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-amber-900">Cari Ayat Al-Quran</span>
                    </Button>
                    
                    {showPalette && (
                      <div className="absolute right-0 top-14 z-50">
                        <SmartBlockPalette onInsert={handleInsertSmartBlock} />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-stone-400 leading-relaxed text-center">
                    Gunakan Smart Blocks untuk menyisipkan referensi Quran dan Hadits secara otomatis tanpa typo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <BookOpen className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Kajian & Blog</h1>
            <p className="text-muted-foreground">Kelola publikasi artikel dan khutbah untuk portal masjid.</p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2 rounded-xl h-12 px-6 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
          <Plus className="h-5 w-5" /> Tulis Kajian
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-stone-400">Memuat artikel...</div>
        ) : posts.length === 0 ? (
          <Card className="col-span-full border-dashed border-2 border-stone-200 bg-stone-50/50 rounded-3xl py-20 flex flex-col items-center">
            <MessageSquare className="h-12 w-12 text-stone-200 mb-4" />
            <p className="text-stone-400 font-medium">Belum ada artikel yang dipublikasikan</p>
            <Button variant="link" onClick={() => setIsCreating(true)} className="text-emerald-600">Mulai menulis sekarang</Button>
          </Card>
        ) : (
          posts.map((p) => (
            <Card key={p.id} className="group illustrative-card overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="h-32 bg-stone-100 flex items-center justify-center border-b group-hover:bg-emerald-50 transition-colors">
                <BookOpen className="h-10 w-10 text-stone-200 group-hover:text-emerald-200" />
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="secondary" className="bg-stone-100 text-stone-600 text-[10px] uppercase font-bold">{p.category}</Badge>
                  <span className="text-[10px] text-stone-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-lg text-stone-800 line-clamp-2 mb-2">{p.title}</h3>
                <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed mb-4">{p.content}</p>
                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                  <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:text-emerald-700 p-0 h-auto">Edit Artikel</Button>
                  <ChevronRight className="h-4 w-4 text-stone-300" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
