import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useUserId, useUserName, useUserRole } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Search, Tag, Pin, Trash2, UserX, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import type { ForumPost, AppUser } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale/id';
export default function ForumPage() {
  const { slug } = useParams();
  const userId = useUserId();
  const userName = useUserName();
  const userRole = useUserRole();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['forum', slug],
    queryFn: () => api<ForumPost[]>(`/api/${slug}/forum`)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', slug],
    queryFn: () => api<AppUser[]>(`/api/${slug}/users`)
  });

  const createMutation = useMutation({
    mutationFn: (newPost: Partial<ForumPost>) => api(`/api/${slug}/forum`, {
      method: 'POST',
      body: JSON.stringify(newPost)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', slug] });
      toast.success('Kiriman berhasil dipublikasikan');
      setIsDialogOpen(false);
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (postId: string) => api(`/api/${slug}/forum/${postId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', slug] });
      toast.success('Kiriman berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus kiriman');
    }
  });

  const pinMutation = useMutation({
    mutationFn: (postId: string) => api(`/api/${slug}/forum/${postId}/pin`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', slug] });
      toast.success('Kiriman berhasil dipin');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memin kiriman');
    }
  });

  const unpinMutation = useMutation({
    mutationFn: (postId: string) => api(`/api/${slug}/forum/${postId}/unpin`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', slug] });
      toast.success('Kiriman berhasil diunpin');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal mengunpin kiriman');
    }
  });

  const banUserMutation = useMutation({
    mutationFn: (userIdToBan: string) => api(`/api/${slug}/users/${userIdToBan}/ban`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', slug] });
      queryClient.invalidateQueries({ queryKey: ['forum', slug] });
      toast.success('Pengguna berhasil diblokir');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memblokir pengguna');
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: (userIdToUnban: string) => api(`/api/${slug}/users/${userIdToUnban}/unban`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', slug] });
      queryClient.invalidateQueries({ queryKey: ['forum', slug] });
      toast.success('Pemblokiran pengguna berhasil dibatalkan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal membatalkan pemblokiran pengguna');
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId || !userName) return toast.error('Anda harus login untuk memposting');
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      category: formData.get('category') as any,
      authorId: userId,
      authorName: userName,
    });
  };

  const handleBanUser = (authorId: string) => {
    if (window.confirm('Yakin ingin memblokir pengguna ini?')) {
      banUserMutation.mutate(authorId);
    }
  };

  const handleUnbanUser = (authorId: string) => {
    if (window.confirm('Yakin ingin membatalkan pemblokiran pengguna ini?')) {
      unbanUserMutation.mutate(authorId);
    }
  };

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserById = (id: string) => users.find(u => u.id === id);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Forum Ummat</h1>
          <p className="text-muted-foreground">Ruang diskusi dan pengumuman untuk jamaah.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
              <Plus className="h-5 w-5" /> Buat Kiriman Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Mulai Diskusi Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select name="category" defaultValue="diskusi">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kajian">Kajian Rutin</SelectItem>
                    <SelectItem value="pengumuman">Pengumuman</SelectItem>
                    <SelectItem value="diskusi">Diskusi Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input name="title" required placeholder="Apa yang ingin Anda bicarakan?" />
              </div>
              <div className="space-y-2">
                <Label>Konten</Label>
                <Textarea name="content" required placeholder="Tuliskan detail kiriman Anda..." className="h-32" />
              </div>
              <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Mempublikasikan...' : 'Publikasikan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card className="illustrative-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Filter Kategori</CardTitle>
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
            </CardContent>
          </Card>

          <Card className="illustrative-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Daftar Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-stone-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {user.isBanned ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnbanUser(user.id)}
                      className="h-8 px-2 gap-1"
                    >
                      <UserCheck className="h-3 w-3" />
                      Batal
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBanUser(user.id)}
                      className="h-8 px-2 gap-1 text-destructive border-destructive hover:bg-destructive/10"
                    >
                      <UserX className="h-3 w-3" />
                      Blokir
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari topik diskusi..."
              className="pl-11 h-12 rounded-xl bg-stone-50 border-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center illustrative-card">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">Belum ada diskusi. Jadilah yang pertama!</p>
              </div>
            ) : (
              filtered.sort((a,b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.createdAt - a.createdAt).map((post) => (
                <ForumPostCard
                  key={post.id}
                  post={post}
                  onDelete={() => {
                    if (window.confirm('Yakin ingin menghapus kiriman ini?')) {
                      deleteMutation.mutate(post.id);
                    }
                  }}
                  onPin={() => {
                    pinMutation.mutate(post.id);
                  }}
                  onUnpin={() => {
                    unpinMutation.mutate(post.id);
                  }}
                  canDelete={userId === post.authorId || userRole === 'superadmin_platform' || userRole === 'dkm_admin'}
                  canPin={userRole === 'superadmin_platform' || userRole === 'dkm_admin'}
                  canBan={userRole === 'superadmin_platform' || userRole === 'dkm_admin'}
                  onBanUser={() => handleBanUser(post.authorId)}
                  getUserById={getUserById}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function ForumPostCard({
  post,
  onDelete,
  canDelete,
  onPin,
  onUnpin,
  canPin,
  canBan,
  onBanUser,
  getUserById
}: {
  post: ForumPost;
  onDelete: () => void;
  canDelete: boolean;
  onPin: () => void;
  onUnpin: () => void;
  canPin: boolean;
  canBan: boolean;
  onBanUser: () => void;
  getUserById: (id: string) => any;
}) {
  const user = getUserById(post.authorId);
  const isBanned = user?.isBanned;

  return (
    <Card className={`illustrative-card hover:border-primary/50 transition-colors group ${isBanned ? 'opacity-60' : ''}`}>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-md bg-stone-50 uppercase text-[10px]">{post.category}</Badge>
            {post.isPinned && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 gap-1">
                <Pin className="h-3 w-3" /> Dipin
              </Badge>
            )}
            {isBanned && (
              <Badge variant="destructive" className="gap-1">
                <UserX className="h-3 w-3" /> Diblokir
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: localeId })}
            </span>
            {canPin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors"
                onClick={post.isPinned ? onUnpin : onPin}
                title={post.isPinned ? 'Lepas pin' : 'Pin kiriman'}
              >
                <Pin className={`h-4 w-4 ${post.isPinned ? 'fill-current text-amber-500' : ''}`} />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {canBan && !isBanned && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors"
                onClick={onBanUser}
                title="Blokir pengguna"
              >
                <UserX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-display font-bold group-hover:text-primary transition-colors">{post.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-3 mt-2">{post.content}</p>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
              {post.authorName ? post.authorName[0] : '?'}
            </div>
            <span className="text-xs font-bold">{post.authorName || 'Anonim'}</span>
            {isBanned && (
              <Badge variant="destructive" className="text-[10px] h-5">
                Diblokir
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Balas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}