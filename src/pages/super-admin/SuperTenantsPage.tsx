import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Building2, MoreVertical, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { TenantWithStats } from '@shared/types';
import { format } from 'date-fns';
export default function SuperTenantsPage() {
  const [search, setSearch] = useState('');
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['super', 'tenants'],
    queryFn: () => api<TenantWithStats[]>('/api/super/tenants')
  });
  const filtered = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.slug.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold">Mosque Management</h1>
          <p className="text-muted-foreground">Directory of all registered mosques on the MasjidHub platform.</p>
        </div>
        <Button className="gap-2">
          <Building2 className="h-4 w-4" /> Export Report
        </Button>
      </div>
      <Card className="illustrative-card overflow-hidden">
        <div className="p-4 border-b bg-stone-50/50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by mosque name or slug..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mosque Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">Loading mosque registry...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">No mosques found matching search.</TableCell></TableRow>
            ) : (
              filtered.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{tenant.name}</span>
                      <span className="text-[10px] text-muted-foreground">Joined {format(tenant.createdAt, 'MMM yyyy')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{tenant.slug}</TableCell>
                  <TableCell>{tenant.memberCount}</TableCell>
                  <TableCell className="font-medium">Rp {tenant.totalBalance.toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'} className={tenant.status === 'active' ? 'bg-emerald-600' : ''}>
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/app/${tenant.slug}/dashboard`} target="_blank" rel="noreferrer" className="flex items-center">
                            <ExternalLink className="h-4 w-4 mr-2" /> Impersonate
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Suspend Mosque</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete Permanently</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}