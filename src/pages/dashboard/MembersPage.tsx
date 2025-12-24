import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Mail, ShieldCheck } from 'lucide-react';
import type { AppUser } from '../../../worker/entities';
export default function MembersPage() {
  const { slug } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', slug],
    queryFn: () => api<AppUser[]>(`/api/${slug}/members`)
  });
  const filtered = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Community Directory</h1>
            <p className="text-muted-foreground">Manage roles for Takmir members and view congregant list.</p>
          </div>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" /> Invite Member
          </Button>
        </div>
        <Card className="illustrative-card overflow-hidden">
          <div className="p-4 border-b bg-stone-50/50 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Loading members...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No members matched your search.</TableCell></TableRow>
              ) : (
                filtered.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{member.name}</span>
                          <span className="text-xs text-muted-foreground italic">Member since 2024</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {member.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Manage Permissions</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}