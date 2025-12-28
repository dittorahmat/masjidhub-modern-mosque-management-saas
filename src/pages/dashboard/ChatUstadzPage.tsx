import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { useUserId, useUserName, useUserRole } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Plus, 
  Send, 
  Users, 
  User, 
  BookOpen, 
  Clock, 
  Search,
  GraduationCap
} from 'lucide-react';
import type { ChatRoom, ChatMessage, Ustadz } from '@shared/types';
// Using native JavaScript for date formatting to reduce bundle size
const formatTimeAgo = (date: number): string => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'baru saja';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} menit yang lalu`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} jam yang lalu`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} hari yang lalu`;
  }

  // For longer periods, use the actual date
  return new Date(date).toLocaleDateString('id-ID');
};

export default function ChatUstadzPage() {
  const { slug } = useParams();
  const userId = useUserId();
  const userName = useUserName();
  const userRole = useUserRole();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedUstadz, setSelectedUstadz] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ustadzList = [], isLoading: ustadzLoading } = useQuery({
    queryKey: ['ustadz', slug],
    queryFn: () => api<Ustadz[]>(`/api/${slug}/ustadz`)
  });

  const { data: chatRooms = [], isLoading: roomsLoading, refetch: refetchRooms } = useQuery({
    queryKey: ['chat-rooms', slug],
    queryFn: () => api<ChatRoom[]>(`/api/${slug}/chat-rooms`),
    enabled: !!userId
  });

  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages', selectedRoom?.id],
    queryFn: () => selectedRoom 
      ? api<ChatMessage[]>(`/api/${slug}/chat-rooms/${selectedRoom.id}/messages`)
      : Promise.resolve([]),
    enabled: !!selectedRoom,
    refetchInterval: selectedRoom ? 5000 : false // Refresh every 5 seconds when room is selected
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createRoomMutation = useMutation({
    mutationFn: (newRoom: Omit<ChatRoom, 'id' | 'tenantId' | 'createdAt'>) => 
      api<ChatRoom>(`/api/${slug}/chat-rooms`, {
        method: 'POST',
        body: JSON.stringify(newRoom)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', slug] });
      toast.success('Ruang obrolan berhasil dibuat');
      setIsDialogOpen(false);
      setNewRoomName('');
      setSelectedUstadz('');
    },
    onError: () => {
      toast.error('Gagal membuat ruang obrolan');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (newMessage: Omit<ChatMessage, 'id' | 'timestamp'>) => 
      api<ChatMessage>(`/api/${slug}/chat-rooms/${selectedRoom?.id}/messages`, {
        method: 'POST',
        body: JSON.stringify(newMessage)
      }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedRoom?.id] });
      // Also update the room's last message
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', slug] });
    },
    onError: () => {
      toast.error('Gagal mengirim pesan');
    }
  });

  const handleCreateRoom = () => {
    if (!newRoomName.trim() || !selectedUstadz) {
      toast.error('Silakan isi nama ruang dan pilih ustadz');
      return;
    }

    const ustadz = ustadzList.find(u => u.id === selectedUstadz);
    if (!ustadz) {
      toast.error('Ustadz tidak ditemukan');
      return;
    }

    createRoomMutation.mutate({
      name: newRoomName,
      participants: [userId || '', ustadz.id],
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedRoom || !userId || !userName) return;

    sendMessageMutation.mutate({
      chatRoomId: selectedRoom.id,
      senderId: userId,
      senderName: userName,
      message: message.trim()
    });
  };

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = userRole === 'dkm_admin' || userRole === 'superadmin_platform';

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Konsultasi Ustadz</h1>
          <p className="text-muted-foreground">Tanya jawab langsung dengan ustadz pilihan Anda.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
              <Plus className="h-5 w-5" /> Buat Obrolan Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mulai Konsultasi Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nama Ruang Obrolan</Label>
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Misal: Konsultasi Fikih dengan Ustadz Ahmad"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Pilih Ustadz</Label>
                <Select value={selectedUstadz} onValueChange={setSelectedUstadz}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ustadz untuk dikonsultasikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {ustadzList.map(ustadz => (
                      <SelectItem key={ustadz.id} value={ustadz.id}>
                        {ustadz.name} ({ustadz.specialization})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setNewRoomName('');
                    setSelectedUstadz('');
                  }}
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleCreateRoom}
                  disabled={createRoomMutation.isPending}
                >
                  {createRoomMutation.isPending ? 'Membuat...' : 'Buat Obrolan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card className="illustrative-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cari Obrolan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Cari obrolan..."
                  className="pl-11 h-12 rounded-xl bg-stone-50 border-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {roomsLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Memuat obrolan...</div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Belum ada obrolan. Buat obrolan baru untuk memulai konsultasi.
                  </div>
                ) : (
                  filteredRooms.map(room => (
                    <div
                      key={room.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedRoom?.id === room.id
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-stone-50'
                      }`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium truncate">{room.name}</h3>
                        {room.lastMessageAt && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(room.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      {room.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {room.lastMessage}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="illustrative-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> Daftar Ustadz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ustadzLoading ? (
                <div className="text-center py-2 text-muted-foreground">Memuat ustadz...</div>
              ) : ustadzList.length === 0 ? (
                <div className="text-center py-2 text-muted-foreground">Belum ada ustadz terdaftar</div>
              ) : (
                ustadzList.map(ustadz => (
                  <div key={ustadz.id} className="flex items-center gap-3 p-2 rounded-lg bg-stone-50">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{ustadz.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {ustadz.specialization}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {ustadz.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selectedRoom ? (
            <>
              <Card className="illustrative-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    {selectedRoom.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-[500px]">
                  <div className="flex-1 mb-4">
                    <ScrollArea className="h-[calc(100%-60px)] w-full rounded-md border p-4">
                      {messagesLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Memuat pesan...</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Belum ada pesan dalam obrolan ini. Kirim pesan pertama Anda!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map(msg => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  msg.senderId === userId
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-stone-100 text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">
                                    {msg.senderName}
                                  </span>
                                  {msg.senderId !== userId && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Ustadz
                                    </Badge>
                                  )}
                                </div>
                                <p>{msg.message}</p>
                                <p className={`text-xs mt-1 ${
                                  msg.senderId === userId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}>
                                  {formatTimeAgo(msg.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ketik pesan Anda..."
                      className="flex-1"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      type="submit"
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      className="h-12 px-4"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="illustrative-card h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">Pilih Obrolan</h3>
                <p className="text-muted-foreground mb-4">
                  Pilih salah satu obrolan dari daftar untuk mulai berdiskusi dengan ustadz
                </p>
                <p className="text-sm text-muted-foreground">
                  Atau buat obrolan baru untuk memulai konsultasi
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}