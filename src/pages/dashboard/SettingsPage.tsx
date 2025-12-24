import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, MapPin, CreditCard, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Tenant } from '@shared/types';
export default function SettingsPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenants', slug],
    queryFn: () => api<Tenant>(`/api/tenants/${slug}`)
  });
  const mutation = useMutation({
    mutationFn: (updates: Partial<Tenant>) => api(`/api/${slug}/settings`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', slug] });
      toast.success('Mosque profile updated');
    }
  });
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    mutation.mutate(data);
  };
  if (isLoading) return <div className="p-8">Loading settings...</div>;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-display font-bold">Mosque Settings</h1>
          <p className="text-muted-foreground">Customize your digital identity and operations.</p>
        </div>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-stone-100 p-1 rounded-xl">
            <TabsTrigger value="general" className="rounded-lg gap-2"><Globe className="h-4 w-4" /> Identity</TabsTrigger>
            <TabsTrigger value="location" className="rounded-lg gap-2"><MapPin className="h-4 w-4" /> Location</TabsTrigger>
            <TabsTrigger value="financial" className="rounded-lg gap-2"><CreditCard className="h-4 w-4" /> Financial</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2"><Shield className="h-4 w-4" /> Security</TabsTrigger>
          </TabsList>
          <form onSubmit={handleSubmit}>
            <TabsContent value="general" className="space-y-4">
              <Card className="illustrative-card">
                <CardHeader>
                  <CardTitle>Public Profile</CardTitle>
                  <CardDescription>This information is visible on your public portal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Mosque Name</Label>
                    <Input id="name" name="name" defaultValue={tenant?.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">About / Bio</Label>
                    <Textarea id="bio" name="bio" defaultValue={tenant?.bio} placeholder="Brief description of your mosque..." className="h-32" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Unique Slug (URL)</Label>
                    <Input id="slug" value={`masjidhub.com/portal/${tenant?.slug}`} disabled className="bg-stone-50" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="location" className="space-y-4">
              <Card className="illustrative-card">
                <CardHeader>
                  <CardTitle>Physical Location</CardTitle>
                  <CardDescription>Help congregants find your mosque.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address</Label>
                    <Textarea id="address" name="address" defaultValue={tenant?.address} placeholder="Street, City, Province, Postal Code" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="financial" className="space-y-4">
              <Card className="illustrative-card">
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                  <CardDescription>Bank details used for donations and infaq tracking.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankInfo">Bank Account Details</Label>
                    <Textarea id="bankInfo" name="bankInfo" defaultValue={tenant?.bankInfo} placeholder="e.g. Bank Syariah Indonesia, Acc: 7123456789 a/n Masjid Al-Noor" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <div className="mt-8 flex justify-end">
              <Button type="submit" size="lg" className="h-12 px-8 gap-2" disabled={mutation.isPending}>
                <Save className="h-5 w-5" /> {mutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </Tabs>
      </div>
    </div>
  );
}