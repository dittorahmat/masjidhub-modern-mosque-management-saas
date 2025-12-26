import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Search, Tag, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
export default function ForumPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Forum Ummat</h1>
            <p className="text-muted-foreground">Ruang diskusi dan pengumuman untuk jamaah.</p>
          </div>
          <Button className="gap-2 rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
            <Plus className="h-5 w-5" /> Buat Kiriman Baru
          </Button>
        </div>
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <Card className="illustrative-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Kategori</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <Button variant="ghost" className="justify-start gap-2 bg-emerald-50 text-emerald-700">
                  <Tag className="h-4 w-4" /> Semua Diskusi
                </Button>
                <Button variant="ghost" className="justify-start gap-2">
                  <Tag className="h-4 w-4" /> Kajian Rutin
                </Button>
                <Button variant="ghost" className="justify-start gap-2">
                  <Tag className="h-4 w-4" /> Pengumuman
                </Button>
                <Button variant="ghost" className="justify-start gap-2">
                  <Tag className="h-4 w-4" /> Jual-Beli (Muamalah)
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Cari topik diskusi..." className="pl-11 h-12 rounded-xl bg-stone-50 border-2" />
            </div>
            <div className="space-y-4">
                <ForumPostCard 
                    title="Jadwal Itikaf Ramadhan 1446H"
                    author="Admin DKM"
                    category="Pengumuman"
                    content="Assalamu'alaikum jamaah sekalian. Berikut adalah jadwal dan pendaftaran itikaf di masjid kita untuk 10 malam terakhir..."
                    isPinned
                />
                <ForumPostCard 
                    title="Pertanyaan Mengenai Zakat Maal"
                    author="Bpk. Rahmat"
                    category="Diskusi"
                    content="Saya ingin bertanya ustadz, jika saya memiliki tabungan pendidikan anak, apakah itu wajib dizakati?"
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function ForumPostCard({ title, author, category, content, isPinned }: any) {
    return (
        <Card className="illustrative-card hover:border-primary/50 transition-colors group">
            <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-md bg-stone-50">{category}</Badge>
                        {isPinned && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 gap-1"><Pin className="h-3 w-3" /> Dipin</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">2 jam yang lalu</span>
                </div>
                <div>
                    <h3 className="text-xl font-display font-bold group-hover:text-primary transition-colors">{title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mt-2">{content}</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-stone-200" />
                        <span className="text-xs font-bold">{author}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <MessageSquare className="h-4 w-4" /> 12 Balasan
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}