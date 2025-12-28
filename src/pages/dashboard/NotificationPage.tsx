import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Bell, Plus, Mail, AlertTriangle, Info, Volume2, Trash2, CheckCircle } from 'lucide-react';
import type { Notification } from '@shared/types';
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

const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-700' },
  { value: 'warning', label: 'Peringatan', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
  { value: 'alert', label: 'Penting', icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
  { value: 'announcement', label: 'Pengumuman', icon: Volume2, color: 'bg-emerald-100 text-emerald-700' },
];

export default function NotificationPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', slug],
    queryFn: () => api<Notification[]>(`/api/${slug}/notifications`)
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['notifications-unread', slug],
    queryFn: () => api<Notification[]>(`/api/${slug}/notifications/unread`),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (newNotification: Omit<Notification, 'id' | 'tenantId' | 'createdAt' | 'readAt'>) => 
      api<Notification>(`/api/${slug}/notifications`, {
        method: 'POST',
        body: JSON.stringify(newNotification)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', slug] });
      toast.success('Notifikasi berhasil dikirim');
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Gagal mengirim notifikasi');
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => 
      api<Notification>(`/api/${slug}/notifications/${id}/read`, {
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', slug] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', slug] });
      toast.success('Notifikasi ditandai sebagai sudah dibaca');
    },
    onError: () => {
      toast.error('Gagal menandai notifikasi');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      api(`/api/${slug}/notifications/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', slug] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', slug] });
      toast.success('Notifikasi berhasil dihapus');
    },
    onError: () => {
      toast.error('Gagal menghapus notifikasi');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as any;

    createMutation.mutate({
      title: data.title,
      message: data.message,
      type: data.type,
      isBroadcast: true // For now, all notifications are broadcast
    });
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus notifikasi ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const getTypeInfo = (type: string) => {
    return NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[0];
  };

  if (isLoading) {
    return <div className="p-8">Memuat notifikasi...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Sistem Notifikasi</h1>
            <p className="text-muted-foreground">Kirim pengumuman dan informasi penting ke jamaah.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
                <Plus className="h-5 w-5" /> Kirim Pengumuman
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kirim Pengumuman Baru</DialogTitle>
                <DialogDescription>
                  Kirim pengumuman atau informasi penting ke semua jamaah di masjid Anda
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Jenis Notifikasi</Label>
                  <Select name="type" defaultValue="announcement" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Judul</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    required 
                    placeholder="Judul pengumuman Anda" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Isi Pengumuman</Label>
                  <Textarea 
                    id="message" 
                    name="message" 
                    required 
                    placeholder="Tuliskan isi pengumuman Anda..." 
                    className="h-32"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Mengirim...' : 'Kirim Pengumuman'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="illustrative-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Notifikasi</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="illustrative-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Mail className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Belum Dibaca</p>
                <p className="text-2xl font-bold">{unreadNotifications.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="illustrative-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Volume2 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pengumuman</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'announcement').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-stone-100 p-1 rounded-xl w-full sm:w-auto flex flex-wrap h-auto">
            <TabsTrigger value="all" className="rounded-lg gap-2 flex-1 sm:flex-initial">
              <Bell className="h-4 w-4" /> Semua
            </TabsTrigger>
            <TabsTrigger value="unread" className="rounded-lg gap-2 flex-1 sm:flex-initial">
              <Mail className="h-4 w-4" /> Belum Dibaca
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {notifications.length === 0 ? (
              <div className="py-20 text-center illustrative-card">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">Belum ada notifikasi. Kirim pengumuman pertama Anda!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map(notification => {
                  const typeInfo = getTypeInfo(notification.type);
                  const IconComponent = typeInfo.icon;
                  
                  return (
                    <Card key={notification.id} className="illustrative-card">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-4">
                            <div className={`h-10 w-10 rounded-full ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">{notification.title}</h3>
                                {!notification.readAt && (
                                  <Badge className="bg-emerald-100 text-emerald-700">Baru</Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground mb-2">{notification.message}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <typeInfo.icon className="h-3 w-3" />
                                  {typeInfo.label}
                                </span>
                                <span>
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              {!notification.readAt && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Tandai Sudah Baca
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unread" className="space-y-4">
            {unreadNotifications.length === 0 ? (
              <div className="py-20 text-center illustrative-card">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">Tidak ada notifikasi belum dibaca</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unreadNotifications.map(notification => {
                  const typeInfo = getTypeInfo(notification.type);
                  const IconComponent = typeInfo.icon;
                  
                  return (
                    <Card key={notification.id} className="illustrative-card border-l-4 border-l-emerald-500">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-4">
                            <div className={`h-10 w-10 rounded-full ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg">{notification.title}</h3>
                              <p className="text-muted-foreground mb-2">{notification.message}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <typeInfo.icon className="h-3 w-3" />
                                  {typeInfo.label}
                                </span>
                                <span>
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Tandai Sudah Baca
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}