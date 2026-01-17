import { Hono } from "hono";
import type { Env } from './core-utils';
import {
  UserEntity,
  TenantEntity,
  TransactionEntity,
  InventoryItemEntity,
  EventEntity,
  EventRegistrationEntity,
  ForumPostEntity,
  ZisTransactionEntity,
  PrayerScheduleEntity,
  NotificationEntity,
  ChatRoomEntity,
  ChatMessageEntity,
  UstadzEntity,
  MustahikEntity
} from "./entities";
import type { UserRole, ZisTransaction } from "@shared/types";
import { ok, bad, notFound } from './core-utils';

// Mock payment processing function - in a real implementation, this would connect to actual payment gateways
async function processZisPayment(transaction: any, paymentMethod: string, amount: number) {
  // In a real implementation, this would connect to actual payment gateways
  // like Midtrans, Xendit, or other Indonesian payment providers
  console.log(`Processing payment for transaction ${transaction.id} using ${paymentMethod}`);

  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

  // For demo purposes, we'll assume all payments succeed
  // In a real implementation, you would connect to actual payment gateway APIs
  const success = Math.random() > 0.1; // 90% success rate for demo

  return {
    status: success ? 'completed' : 'failed',
    reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    gateway: paymentMethod
  };
}

export function userRoutes(app: Hono<any>) {
  const getTenantBySlug = async (env: Env, slug: string) => {
    await TenantEntity.ensureSeed(env);
    await UserEntity.ensureSeed(env);
    const { items } = await TenantEntity.list(env);
    return items.find(t => t.slug === slug);
  };

  // Enhanced function that can get tenant by either slug or subdomain from context
  const getTenantBySlugOrSubdomain = async (c: any, env: Env) => {
    // First, try to get slug from URL parameter
    const slug = c.req.param('slug');

    if (slug) {
      return await getTenantBySlug(env, slug);
    }

    // If no slug in URL, try to get from subdomain in context
    const subdomain = c.get('subdomain');
    if (subdomain) {
      return await getTenantBySlug(env, subdomain);
    }

    return null;
  };
  // --- PUBLIC & AUTH ---
  app.get('/api/check-subdomain/:slug', async (c) => {
    const slug = c.req.param('slug').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const { items } = await TenantEntity.list(c.env);
    const exists = items.some(t => t.slug === slug);
    return ok(c, { available: !exists, slug });
  });

  app.post('/api/auth/register', async (c) => {
    const { name, email, mosqueName, slug, address, legalDocUrl } = await c.req.json();
    if (!name || !email || !mosqueName || !slug) return bad(c, 'All fields are required');
    const tenantId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const tenant = await TenantEntity.create(c.env, {
      id: tenantId,
      name: mosqueName,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      ownerId: userId,
      createdAt: Date.now(),
      address,
      legalDocUrl,
      status: 'pending'
    });
    const user = await UserEntity.create(c.env, {
      id: userId,
      name,
      email,
      role: 'dkm_admin',
      tenantIds: [tenantId]
    });
    return ok(c, { user, tenant });
  });
  app.post('/api/auth/login', async (c) => {
    const { email } = await c.req.json();
    const { items } = await UserEntity.list(c.env);
    let user = items.find(u => u.email === email);
    if (!user) {
        // Define role based on email
        const role: UserRole =
            email === 'admin@masjidhub.com' ? 'superadmin_platform' :
            email === 'demo-dkm@masjid.org' ? 'dkm_admin' :
            email === 'demo-amil@masjid.org' ? 'amil_zakat' :
            email === 'demo-ustadz@masjid.org' ? 'ustadz' :
            email === 'demo-jamaah@masjid.org' ? 'jamaah' :
            'dkm_admin'; // Default role for other emails

        user = {
            id: crypto.randomUUID(),
            name: "Demo User",
            email: email,
            role: role,
            tenantIds: ['t1']
        };
    }
    return ok(c, { user });
  });
  // --- SUPER ADMIN ---
  app.get('/api/super/summary', async (c) => {
    const { items: tenants } = await TenantEntity.list(c.env);
    const { items: users } = await UserEntity.list(c.env);
    const { items: txs } = await TransactionEntity.list(c.env);
    const { items: events } = await EventEntity.list(c.env);
    return ok(c, {
      totalTenants: tenants.length,
      totalUsers: users.length,
      totalBalance: txs.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      activeEvents: events.filter(e => e.date > Date.now()).length,
      pendingApprovals: tenants.filter(t => t.status === 'pending').length
    });
  });
  app.get('/api/super/tenants', async (c) => {
    const { items: tenants } = await TenantEntity.list(c.env);
    const { items: txs } = await TransactionEntity.list(c.env);
    const { items: users } = await UserEntity.list(c.env);
    const enriched = tenants.map(t => ({
      ...t,
      totalBalance: txs.filter(tx => tx.tenantId === t.id).reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      memberCount: users.filter(u => u.tenantIds.includes(t.id)).length,
      eventCount: 0
    }));
    return ok(c, enriched);
  });
  app.get('/api/super/users', async (c) => {
    const { items: users } = await UserEntity.list(c.env);
    return ok(c, users);
  });
  app.post('/api/super/tenants/:id/approve', async (c) => {
    const id = c.req.param('id');
    const inst = new TenantEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Tenant not found');
    await inst.patch({ status: 'active' });
    return ok(c, { success: true });
  });
  // --- TENANT CONTEXT ROUTES ---
  app.get('/api/tenants/:slug', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Mosque not found');
    return ok(c, tenant);
  });
  app.put('/api/:slug/settings', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const inst = new TenantEntity(c.env, tenant.id);
    await inst.patch(body);
    return ok(c, await inst.getState());
  });
  // Finance
  app.get('/api/:slug/finance', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await TransactionEntity.list(c.env);
    return ok(c, items.filter(t => t.tenantId === tenant.id));
  });
  app.post('/api/:slug/finance', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const tx = await TransactionEntity.create(c.env, { ...body, id: crypto.randomUUID(), tenantId: tenant.id });
    return ok(c, tx);
  });
  // ZIS
  app.get('/api/:slug/zis', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ZisTransactionEntity.list(c.env);
    return ok(c, items.filter(t => t.tenantId === tenant.id));
  });
  app.post('/api/:slug/zis', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const tx = await ZisTransactionEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      date: Date.now(),
      payment_status: body.payment_status || 'pending'
    });
    return ok(c, tx);
  });

  // ZIS Payment Processing
  app.post('/api/:slug/zis/:id/process-payment', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new ZisTransactionEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'ZIS Transaction not found');

    const tx = await inst.getState();
    if (tx.tenantId !== tenant.id) return notFound(c, 'ZIS Transaction not found');

    const body = await c.req.json();
    const paymentResult = await processZisPayment(tx, body.payment_method, body.amount);

    await inst.patch({
      payment_method: body.payment_method,
      payment_status: paymentResult.status as ZisTransaction['payment_status'],
      payment_reference: paymentResult.reference,
      payment_gateway: paymentResult.gateway,
      payment_date: Date.now()
    });

    return ok(c, await inst.getState());
  });

  // ZIS Reporting
  app.get('/api/:slug/zis/report', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ZisTransactionEntity.list(c.env);
    const zisTransactions = items.filter(t => t.tenantId === tenant.id);

    // Calculate totals by type
    const totals = zisTransactions.reduce((acc, tx) => {
      if (tx.flow === 'in') {
        acc[tx.type] = (acc[tx.type] || 0) + tx.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate by date range if provided
    const from = c.req.query('from');
    const to = c.req.query('to');

    let filteredTransactions = zisTransactions;
    if (from || to) {
      const fromDate = from ? new Date(from as string).getTime() : 0;
      const toDate = to ? new Date(to as string).getTime() : Date.now();
      filteredTransactions = zisTransactions.filter(tx =>
        tx.date >= fromDate && tx.date <= toDate
      );
    }

    // Group by type
    const byType = filteredTransactions.reduce((acc, tx) => {
      if (!acc[tx.type]) {
        acc[tx.type] = [];
      }
      acc[tx.type].push(tx);
      return acc;
    }, {} as Record<string, ZisTransaction[]>);

    // Group by month
    const byMonth = filteredTransactions.reduce((acc, tx) => {
      const month = new Date(tx.date).toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(tx);
      return acc;
    }, {} as Record<string, ZisTransaction[]>);

    return ok(c, {
      totals,
      byType,
      byMonth,
      totalAmount: filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      totalTransactions: filteredTransactions.length
    });
  });
  // Inventory
  app.get('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await InventoryItemEntity.list(c.env);
    return ok(c, items.filter(i => i.tenantId === tenant.id));
  });
  app.post('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const item = await InventoryItemEntity.create(c.env, { ...body, id: crypto.randomUUID(), tenantId: tenant.id });
    return ok(c, item);
  });
  // Events
  app.get('/api/:slug/events', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await EventEntity.list(c.env);
    return ok(c, items.filter(e => e.tenantId === tenant.id));
  });
  app.post('/api/:slug/events', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const event = await EventEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      currentRegistrations: 0
    });
    return ok(c, event);
  });

  app.put('/api/:slug/events/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new EventEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Event not found');

    const body = await c.req.json();
    await inst.patch(body);
    return ok(c, await inst.getState());
  });

  app.post('/api/:slug/events/:id/register', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const eventId = c.req.param('id');
    const body = await c.req.json();
    const eventInst = new EventEntity(c.env, eventId);
    if (!(await eventInst.exists())) return notFound(c, 'Event not found');
    const reg = await EventRegistrationEntity.create(c.env, {
      id: crypto.randomUUID(),
      eventId,
      tenantId: tenant.id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      registeredAt: Date.now()
    });
    await eventInst.mutate(s => ({
      ...s,
      currentRegistrations: s.currentRegistrations + 1
    }));
    return ok(c, reg);
  });
  // Members
  app.get('/api/:slug/members', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await UserEntity.list(c.env);
    return ok(c, items.filter(u => u.tenantIds.includes(tenant.id)));
  });
  // Forum
  app.get('/api/:slug/forum', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ForumPostEntity.list(c.env);
    return ok(c, items.filter(p => p.tenantId === tenant.id));
  });
  app.post('/api/:slug/forum', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const post = await ForumPostEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      createdAt: Date.now()
    });
    return ok(c, post);
  });
  app.delete('/api/:slug/forum/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new ForumPostEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Post not found');
    await ForumPostEntity.delete(c.env, id);
    return ok(c, { success: true });
  });

  // Forum Pinning
  app.post('/api/:slug/forum/:id/pin', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new ForumPostEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Post not found');

    await inst.patch({ isPinned: true });
    return ok(c, await inst.getState());
  });

  app.post('/api/:slug/forum/:id/unpin', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new ForumPostEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Post not found');

    await inst.patch({ isPinned: false });
    return ok(c, await inst.getState());
  });

  // User Management (for banning)
  app.get('/api/:slug/users', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await UserEntity.list(c.env);
    return ok(c, items.filter(u => u.tenantIds.includes(tenant.id)));
  });

  app.post('/api/:slug/users/:id/ban', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const userId = c.req.param('id');
    const inst = new UserEntity(c.env, userId);
    if (!(await inst.exists())) return notFound(c, 'User not found');

    const user = await inst.getState();
    if (!user.tenantIds.includes(tenant.id)) return notFound(c, 'User not found in this tenant');

    await inst.patch({ isBanned: true });
    return ok(c, { success: true, message: 'User banned successfully' });
  });

  app.post('/api/:slug/users/:id/unban', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const userId = c.req.param('id');
    const inst = new UserEntity(c.env, userId);
    if (!(await inst.exists())) return notFound(c, 'User not found');

    const user = await inst.getState();
    if (!user.tenantIds.includes(tenant.id)) return notFound(c, 'User not found in this tenant');

    await inst.patch({ isBanned: false });
    return ok(c, { success: true, message: 'User unbanned successfully' });
  });

  // Prayer Schedule
  app.get('/api/:slug/prayer-schedules', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await PrayerScheduleEntity.list(c.env);
    return ok(c, items.filter(s => s.tenantId === tenant.id));
  });

  app.post('/api/:slug/prayer-schedules', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const schedule = await PrayerScheduleEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id
    });
    return ok(c, schedule);
  });

  app.put('/api/:slug/prayer-schedules/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new PrayerScheduleEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Schedule not found');

    const body = await c.req.json();
    await inst.patch(body);
    return ok(c, await inst.getState());
  });

  app.delete('/api/:slug/prayer-schedules/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new PrayerScheduleEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Schedule not found');
    await PrayerScheduleEntity.delete(c.env, id);
    return ok(c, { success: true });
  });

  // Notifications
  app.get('/api/:slug/notifications', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await NotificationEntity.list(c.env);
    return ok(c, items.filter(n => n.tenantId === tenant.id).sort((a, b) => b.createdAt - a.createdAt));
  });

  app.get('/api/:slug/notifications/unread', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await NotificationEntity.list(c.env);
    return ok(c, items.filter(n => n.tenantId === tenant.id && !n.readAt).sort((a, b) => b.createdAt - a.createdAt));
  });

  app.post('/api/:slug/notifications', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const notification = await NotificationEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      createdAt: Date.now()
    });
    return ok(c, notification);
  });

  app.post('/api/:slug/notifications/:id/read', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new NotificationEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Notification not found');

    await inst.patch({ readAt: Date.now() });
    return ok(c, await inst.getState());
  });

  app.delete('/api/:slug/notifications/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new NotificationEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Notification not found');
    await NotificationEntity.delete(c.env, id);
    return ok(c, { success: true });
  });

  // Ustadz Management
  app.get('/api/:slug/ustadz', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await UstadzEntity.list(c.env);
    return ok(c, items.filter(u => u.tenantId === tenant.id && u.isActive));
  });

  app.post('/api/:slug/ustadz', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const ustadz = await UstadzEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      createdAt: Date.now()
    });
    return ok(c, ustadz);
  });

  app.put('/api/:slug/ustadz/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new UstadzEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Ustadz not found');

    const body = await c.req.json();
    await inst.patch(body);
    return ok(c, await inst.getState());
  });

  app.delete('/api/:slug/ustadz/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new UstadzEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Ustadz not found');
    await inst.patch({ isActive: false }); // Soft delete by deactivating
    return ok(c, { success: true });
  });

  // Mustahik (ZIS Recipients) Management
  app.get('/api/:slug/mustahik', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await MustahikEntity.list(c.env);
    return ok(c, items.filter(m => m.tenantId === tenant.id));
  });

  app.post('/api/:slug/mustahik', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const mustahik = await MustahikEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      registrationDate: Date.now()
    });
    return ok(c, mustahik);
  });

  app.put('/api/:slug/mustahik/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new MustahikEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Mustahik not found');

    const body = await c.req.json();
    await inst.patch(body);
    return ok(c, await inst.getState());
  });

  app.delete('/api/:slug/mustahik/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const inst = new MustahikEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Mustahik not found');
    await MustahikEntity.delete(c.env, id);
    return ok(c, { success: true });
  });

  // Chat Rooms
  app.get('/api/:slug/chat-rooms', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ChatRoomEntity.list(c.env);
    return ok(c, items.filter(room => room.tenantId === tenant.id));
  });

  app.post('/api/:slug/chat-rooms', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const chatRoom = await ChatRoomEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      createdAt: Date.now()
    });
    return ok(c, chatRoom);
  });

  app.get('/api/:slug/chat-rooms/:roomId', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const roomId = c.req.param('roomId');
    const inst = new ChatRoomEntity(c.env, roomId);
    if (!(await inst.exists())) return notFound(c, 'Chat room not found');

    const room = await inst.getState();
    if (room.tenantId !== tenant.id) return notFound(c, 'Chat room not found');

    return ok(c, room);
  });

  // Chat Messages
  app.get('/api/:slug/chat-rooms/:roomId/messages', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const roomId = c.req.param('roomId');

    // Verify that the chat room exists and belongs to the tenant
    const roomInst = new ChatRoomEntity(c.env, roomId);
    if (!(await roomInst.exists())) return notFound(c, 'Chat room not found');
    const room = await roomInst.getState();
    if (room.tenantId !== tenant.id) return notFound(c, 'Chat room not found');

    const { items } = await ChatMessageEntity.list(c.env);
    return ok(c, items
      .filter(msg => msg.chatRoomId === roomId)
      .sort((a, b) => a.timestamp - b.timestamp));
  });

  app.post('/api/:slug/chat-rooms/:roomId/messages', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const roomId = c.req.param('roomId');

    // Verify that the chat room exists and belongs to the tenant
    const roomInst = new ChatRoomEntity(c.env, roomId);
    if (!(await roomInst.exists())) return notFound(c, 'Chat room not found');
    const room = await roomInst.getState();
    if (room.tenantId !== tenant.id) return notFound(c, 'Chat room not found');

    const body = await c.req.json();
    const message = await ChatMessageEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      chatRoomId: roomId,
      timestamp: Date.now()
    });

    // Update the last message in the chat room
    await roomInst.mutate(s => ({
      ...s,
      lastMessageAt: Date.now(),
      lastMessage: body.message.length > 50 ? body.message.substring(0, 50) + '...' : body.message
    }));

    return ok(c, message);
  });

  // Search functionality
  app.get('/api/:slug/search', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');

    const query = c.req.query('q') || '';
    if (!query) return bad(c, 'Query parameter "q" is required');

    const searchTerm = query.toLowerCase();

    // Search across multiple entities
    const [transactions, inventoryItems, events, forumPosts, zisTransactions] = await Promise.all([
      TransactionEntity.list(c.env),
      InventoryItemEntity.list(c.env),
      EventEntity.list(c.env),
      ForumPostEntity.list(c.env),
      ZisTransactionEntity.list(c.env)
    ]);

    // Filter results by tenant and search term
    const results = {
      transactions: transactions.items
        .filter(t => t.tenantId === tenant.id &&
          (t.description.toLowerCase().includes(searchTerm) ||
           t.category.toLowerCase().includes(searchTerm)))
        .slice(0, 5),
      inventory: inventoryItems.items
        .filter(i => i.tenantId === tenant.id &&
          i.name.toLowerCase().includes(searchTerm))
        .slice(0, 5),
      events: events.items
        .filter(e => e.tenantId === tenant.id &&
          (e.title.toLowerCase().includes(searchTerm) ||
           e.description.toLowerCase().includes(searchTerm)))
        .slice(0, 5),
      forum: forumPosts.items
        .filter(p => p.tenantId === tenant.id &&
          (p.title.toLowerCase().includes(searchTerm) ||
           p.content.toLowerCase().includes(searchTerm)))
        .slice(0, 5),
      zis: zisTransactions.items
        .filter(z => z.tenantId === tenant.id &&
          z.description.toLowerCase().includes(searchTerm))
        .slice(0, 5)
    };

    return ok(c, results);
  });

  // QR Code generation for mosque access
  app.get('/api/:slug/qr-code', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');

    // In a real implementation, you would generate an actual QR code
    // For now, we'll return a placeholder with the tenant slug
    const qrData = `masjidhub://${tenant.slug}`;

    return ok(c, {
      slug: tenant.slug,
      name: tenant.name,
      qrData,
      url: `https://masjidhub.com/portal/${tenant.slug}`
    });
  });
}