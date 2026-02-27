import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { useUserName } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Send, 
  Search, 
  User, 
  Shield, 
  Sparkles
} from 'lucide-react';
import type { ChatSession, AIChatMessage } from '@shared/types';
import { cn } from '@/lib/utils';

export default function SharedInboxPage() {
  const { slug } = useParams();
  const userName = useUserName();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions', slug],
    queryFn: () => api<ChatSession[]>(`/api/${slug}/chat/sessions`)
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedSession?.id],
    queryFn: () => selectedSession 
      ? api<AIChatMessage[]>(`/api/${slug}/chat/sessions/${selectedSession.id}/messages`)
      : Promise.resolve([]),
    enabled: !!selectedSession,
    refetchInterval: selectedSession ? 3000 : false
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const replyMutation = useMutation({
    mutationFn: (text: string) => 
      api<AIChatMessage>(`/api/${slug}/chat/sessions/${selectedSession?.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ text, adminName: userName })
      }),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedSession?.id] });
    },
    onError: () => toast.error('Gagal mengirim balasan')
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSession) return;
    replyMutation.mutate(replyText.trim());
  };

  const filteredSessions = sessions.filter(s => 
    s.id.includes(searchTerm) || (s.userId && s.userId.includes(searchTerm))
  );

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 animate-fade-in">
      <div className="w-80 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input 
            placeholder="Cari percakapan..." 
            className="pl-9 rounded-xl border-stone-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Card className="flex-1 overflow-hidden border-stone-200 shadow-sm rounded-2xl">
          <CardHeader className="py-3 px-4 border-b bg-stone-50/50">
            <CardTitle className="text-xs uppercase tracking-wider text-stone-500 font-bold">Inbox Percakapan</CardTitle>
          </CardHeader>
          <ScrollArea className="h-full">
            {sessionsLoading ? (
              <div className="p-4 text-center text-sm text-stone-400">Memuat...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-sm text-stone-400">Tidak ada percakapan aktif</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className={cn(
                      "w-full text-left p-4 hover:bg-stone-50 transition-colors flex items-center gap-3",
                      selectedSession?.id === s.id && "bg-emerald-50/50 border-r-4 border-emerald-600"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={s.isAnonymous ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                        {s.isAnonymous ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-sm text-stone-800">
                          {s.isAnonymous ? "Jamaah Anonim" : "Pengguna Terdaftar"}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(s.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 truncate">Sesi: {s.id.slice(0, 8)}...</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {selectedSession ? (
          <>
            <Card className="flex-1 flex flex-col overflow-hidden border-stone-200 shadow-sm rounded-2xl">
              <CardHeader className="py-3 px-6 border-b bg-white flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-stone-800">
                    {selectedSession.isAnonymous ? "Percakapan Anonim" : "Percakapan Member"}
                  </div>
                  {selectedSession.isAnonymous && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Shadow ID Active</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-stone-400 hover:text-rose-600">
                  Tutup Sesi
                </Button>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-6 bg-stone-50/30">
                <div className="space-y-6">
                  {messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={cn(
                        "flex flex-col",
                        m.senderRole === 'user' ? "items-start" : "items-end"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">
                          {m.senderRole === 'user' ? "Jamaah" : m.senderRole === 'ai' ? "Asisten AI" : "Admin"}
                        </span>
                      </div>
                      <div className={cn(
                        "max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm",
                        m.senderRole === 'user' 
                          ? "bg-white border border-stone-200 text-stone-800 rounded-tl-none" 
                          : m.senderRole === 'ai'
                            ? "bg-cyan-50 border border-cyan-100 text-cyan-900 rounded-tr-none"
                            : "bg-emerald-600 text-white rounded-tr-none"
                      )}>
                        <p className="leading-relaxed">{m.text}</p>
                        <p className={cn(
                          "text-[9px] mt-1 text-right",
                          m.senderRole === 'admin' ? "text-emerald-100" : "text-stone-400"
                        )}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 bg-white border-t border-stone-100">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input 
                    placeholder="Tulis balasan manual..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 rounded-xl bg-stone-50 border-none focus-visible:ring-emerald-500"
                  />
                  <Button 
                    type="submit" 
                    disabled={!replyText.trim() || replyMutation.isPending}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6"
                  >
                    <Send className="h-4 w-4 mr-2" /> Kirim
                  </Button>
                </form>
              </div>
            </Card>

            <Card className="border-cyan-100 bg-cyan-50/30 rounded-2xl shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-cyan-800">
                  <div className="bg-cyan-100 p-2 rounded-full">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">AI Co-pilot Ready.</span> Klik untuk melihat draf jawaban otomatis.
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-cyan-200 text-cyan-700 bg-white hover:bg-cyan-50">
                  Lihat Draf
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex flex-col items-center justify-center border-dashed border-2 border-stone-200 bg-stone-50/50 rounded-3xl">
            <MessageCircle className="h-12 w-12 text-stone-200 mb-4" />
            <p className="text-stone-400 font-medium">Pilih percakapan untuk memulai</p>
          </Card>
        )}
      </div>
    </div>
  );
}
