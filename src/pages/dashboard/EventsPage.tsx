import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, MapPin, Users, Plus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Event } from '@shared/types';
export default function EventsPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', slug],
    queryFn: () => api<Event[]>(`/api/${slug}/events`)
  });
  const createMutation = useMutation({
    mutationFn: (newEvent: Partial<Event>) => api(`/api/${slug}/events`, {
      method: 'POST',
      body: JSON.stringify(newEvent)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', slug] });
      toast.success('Event created successfully');
      setIsDialogOpen(false);
    }
  });
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: new Date(formData.get('date') as string).getTime(),
      location: formData.get('location') as string,
      capacity: Number(formData.get('capacity')),
    });
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Event Management</h1>
            <p className="text-muted-foreground">Plan activities and engage with your congregation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.open(`/portal/${slug}`, '_blank')}>
              <ExternalLink className="h-4 w-4" /> View Public Portal
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule New Activity</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Event Title</Label>
                    <Input name="title" required placeholder="e.g. Ramadan Iftar Dinner" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea name="description" required placeholder="Tell the community about this event..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date & Time</Label>
                      <Input name="date" type="datetime-local" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Capacity</Label>
                      <Input name="capacity" type="number" required defaultValue="100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input name="location" required placeholder="e.g. Mosque Main Hall" />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Publishing...' : 'Publish Event'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Card key={i} className="h-64 animate-pulse bg-stone-100" />)
          ) : events.length === 0 ? (
            <div className="col-span-full py-20 text-center illustrative-card">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No events scheduled yet.</p>
            </div>
          ) : (
            events.sort((a,b) => a.date - b.date).map((event) => {
              const isPast = event.date < Date.now();
              return (
                <Card key={event.id} className={`illustrative-card ${isPast ? 'opacity-70' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={isPast ? "secondary" : "default"} className={isPast ? "" : "bg-emerald-600"}>
                        {isPast ? "Past Event" : "Upcoming"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {event.currentRegistrations} / {event.capacity} RSVPs
                      </span>
                    </div>
                    <CardTitle className="text-2xl font-display">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm text-foreground/80">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        {format(event.date, 'PPP p')}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {event.location}
                      </div>
                    </div>
                    <div className="pt-4 border-t flex justify-between gap-2">
                      <Button variant="ghost" size="sm">Manage Registrations</Button>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}