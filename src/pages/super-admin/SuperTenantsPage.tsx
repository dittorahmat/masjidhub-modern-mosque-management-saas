import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Building2, MoreVertical, ExternalLink, Power, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { TenantWithStats } from '@shared/types';
export default function SuperTenantsPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['super', 'tenants'],
    queryFn: () => api<TenantWithStats[]>('/api/super/tenants')
  });
  const approveMutation = useMutation({
    mutationFn: (id: string) => api(`/api/super/tenants/${id}/approve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super', 'tenants'] });
      toast.success('Masjid berhasil disetujui!');
    }
  });
  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );
  const pendingTenants = filtered.filter(t => t.status === 'pending');
  const activeTenants = filtered.filter(t => t.status === 'active');
  const TenantTable = ({ data }: { data: TenantWithStats[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Masjid</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Anggota</TableHead>
          <TableHead>Saldo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow><TableCell colSpan={6} className="text-center py-10 opacity-50">Tidak ada data ditemukan.</TableCell></TableRow>
        ) : (
          data.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold">{tenant.name}</span>
                  <span className="text-[10px] text-muted-foreground italic">Dibuat {format(tenant.createdAt, 'dd MMM yyyy')}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">{tenant.slug}</TableCell>
              <TableCell>{tenant.memberCount}</TableCell>
              <TableCell>Rp {tenant.totalBalance.toLocaleString('id-ID')}</TableCell>
              <TableCell>
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right flex justify-end gap-2">
                {tenant.status === 'pending' && (
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100" onClick={() => approveMutation.mutate(tenant.id)}>
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a href={`/app/${tenant.slug}/dashboard`} target="_blank" rel="noreferrer" className="flex items-center cursor-pointer">
                        <ExternalLink className="h-4 w-4 mr-2" /> Lihat Portal
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive cursor-pointer">
                      <Trash2 className="h-4 w-4 mr-2" /> Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Manajemen Masjid</h1>
          <p className="text-muted-foreground">Kelola pendaftaran dan status masjid secara global.</p>
        </div>
      </div>
      <Tabs defaultValue="pending" className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <TabsList className="bg-stone-100 p-1">
            <TabsTrigger value="pending" className="gap-2">
              Pending {pendingTenants.length > 0 && <Badge className="h-5 w-5 p-0 justify-center rounded-full bg-amber-500">{pendingTenants.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="all">Semua</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari masjid..." className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <TabsContent value="pending" className="m-0">
          <Card className="illustrative-card overflow-hidden">
            <TenantTable data={pendingTenants} />
          </Card>
        </TabsContent>
        <TabsContent value="active" className="m-0">
          <Card className="illustrative-card overflow-hidden">
            <TenantTable data={activeTenants} />
          </Card>
        </TabsContent>
        <TabsContent value="all" className="m-0">
          <Card className="illustrative-card overflow-hidden">
            <TenantTable data={filtered} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}