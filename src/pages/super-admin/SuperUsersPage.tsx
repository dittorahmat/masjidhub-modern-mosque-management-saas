import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Mail, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { AppUser } from '@shared/types';
export default function SuperUsersPage() {
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['super', 'users'],
    queryFn: () => api<AppUser[]>('/api/super/users')
  });
  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin': return <Badge variant="destructive">Platform Admin</Badge>;
      case 'mosque_admin': return <Badge className="bg-emerald-600">Mosque Admin</Badge>;
      case 'takmir': return <Badge className="bg-blue-600">Takmir</Badge>;
      default: return <Badge variant="outline">Jamaah</Badge>;
    }
  };
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-4xl font-display font-bold">User Directory</h1>
        <p className="text-muted-foreground">Global view of all registered accounts across all mosque tenants.</p>
      </div>
      <Card className="illustrative-card overflow-hidden">
        <div className="p-4 border-b bg-stone-50/50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tenant Count</TableHead>
              <TableHead className="text-right">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10">Syncing user database...</TableCell></TableRow>
            ) : filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</div>
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{user.tenantIds?.length || 0}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Audit Logs</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}