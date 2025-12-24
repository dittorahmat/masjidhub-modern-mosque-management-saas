import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Landmark, Calendar, MapPin, Wallet, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Tenant, Event } from '@shared/types';
export default function PublicPortalPage() {
  const { slug } = useParams();
  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ['tenants', slug],
    queryFn: () => api<Tenant>(`/api/tenants/${slug}`)
  });
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['events', slug],
    queryFn: () => api<Event[]>(`/api/${slug}/events`)
  });
  if (loadingTenant) return <div className="h-screen flex items-center justify-center">Loading portal...</div>;
  if (!tenant) return <div className="h-screen flex items-center justify-center">Portal not found.</div>;
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="bg-primary text-white py-16 px-4 md:py-24 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="max-w-7xl mx-auto text-center space-y-6 relative z-10">
          <Landmark className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">{tenant.name}</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-3xl mx-auto">
            {tenant.bio || "Welcome to our digital community space."}
          </p>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 space-y-16 pb-24">
        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="illustrative-card p-8">
            <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" /> Location
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {tenant.address || "Contact mosque for location details."}
            </p>
          </Card>
          <Card className="illustrative-card p-8">
            <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" /> Support Us
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-6">
              Your Infaq and Sodaqoh help us serve the community better.
            </p>
            <div className="p-4 bg-emerald-50 rounded-xl border-2 border-primary/20">
              <code className="text-sm text-emerald-800 break-words whitespace-pre-line">
                {tenant.bankInfo || "Bank details coming soon."}
              </code>
            </div>
          </Card>
        </div>
        {/* Events Section */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-display font-bold">Upcoming Activities</h2>
            <p className="text-muted-foreground mt-2">Join our programs and be part of the community.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.filter(e => e.date > Date.now()).length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground italic">
                No upcoming events at the moment.
              </div>
            ) : (
              events.filter(e => e.date > Date.now()).map((event) => (
                <EventPublicCard key={event.id} event={event} slug={slug!} />
              ))
            )}
          </div>
        </section>
      </main>
      <footer className="border-t py-12 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p className="font-display font-bold text-foreground mb-2">{tenant.name}</p>
          <p>Powered by MasjidHub</p>
        </div>
      </footer>
    </div>
  );
}
function EventPublicCard({ event, slug }: { event: Event, slug: string }) {
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: (data: any) => api(`/api/${slug}/events/${event.id}/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast.success('Successfully registered for ' + event.title);
      setOpen(false);
    }
  });
  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate(Object.fromEntries(formData.entries()));
  };
  const isFull = event.currentRegistrations >= event.capacity;
  return (
    <Card className="illustrative-card overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-stone-50/50 pb-4">
        <Badge className="w-fit mb-2 bg-emerald-600">Open Registration</Badge>
        <CardTitle className="text-2xl font-display">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">{event.description}</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {format(event.date, 'PPP p')}</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {event.location}</div>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-12 text-lg rounded-xl mt-4" disabled={isFull}>
              {isFull ? 'Fully Booked' : 'Register Now'} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register for {event.title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" required placeholder="Ahmad Fikri" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" required placeholder="ahmad@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input name="phone" required placeholder="0812..." />
              </div>
              <Button type="submit" className="w-full h-12 text-lg" disabled={mutation.isPending}>
                {mutation.isPending ? 'Registering...' : 'Confirm Registration'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}