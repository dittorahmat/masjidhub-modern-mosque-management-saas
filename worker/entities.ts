import { IndexedEntity } from "./core-utils";
import type { Transaction, InventoryItem, Event, EventRegistration, Tenant } from "@shared/types";
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'mosque_admin' | 'takmir' | 'jamaah';
  tenantIds: string[];
}
export class TenantEntity extends IndexedEntity<Tenant> {
  static readonly entityName = "tenant";
  static readonly indexName = "tenants";
  static readonly initialState: Tenant = {
    id: "",
    name: "",
    slug: "",
    ownerId: "",
    createdAt: 0,
    address: "",
    bankInfo: "",
    bio: ""
  };
  static seedData: Tenant[] = [
    {
      id: "t1",
      name: "Masjid Al-Hikmah",
      slug: "al-hikmah",
      ownerId: "u1",
      createdAt: Date.now(),
      address: "Jl. Sudirman No. 12, Jakarta",
      bankInfo: "BSI 7123456789 a/n Masjid Al-Hikmah",
      bio: "A community-focused mosque dedicated to religious education and social welfare."
    }
  ];
}
export class UserEntity extends IndexedEntity<AppUser> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: AppUser = {
    id: "",
    name: "",
    email: "",
    role: "jamaah",
    tenantIds: []
  };
  static seedData: AppUser[] = [
    {
      id: "u1",
      name: "Admin Utama",
      email: "admin@masjidhub.com",
      role: "superadmin",
      tenantIds: ["t1"]
    }
  ];
}
export class TransactionEntity extends IndexedEntity<Transaction> {
  static readonly entityName = "transaction";
  static readonly indexName = "transactions";
  static readonly initialState: Transaction = {
    id: "",
    tenantId: "",
    type: "income",
    amount: 0,
    category: "",
    description: "",
    date: 0,
    createdBy: ""
  };
  static seedData: Transaction[] = [
    {
      id: "tr1",
      tenantId: "t1",
      type: "income",
      amount: 500000,
      category: "Friday Donation",
      description: "General Infaq from Friday Prayer",
      date: Date.now(),
      createdBy: "u1"
    }
  ];
}
export class InventoryItemEntity extends IndexedEntity<InventoryItem> {
  static readonly entityName = "inventory_item";
  static readonly indexName = "inventory";
  static readonly initialState: InventoryItem = {
    id: "",
    tenantId: "",
    name: "",
    quantity: 0,
    condition: "good",
    location: ""
  };
  static seedData: InventoryItem[] = [
    {
      id: "inv1",
      tenantId: "t1",
      name: "Sound System Main Hall",
      quantity: 1,
      condition: "good",
      location: "Main Prayer Hall",
      lastMaintenance: Date.now()
    }
  ];
}
export class EventEntity extends IndexedEntity<Event> {
  static readonly entityName = "event";
  static readonly indexName = "events";
  static readonly initialState: Event = {
    id: "",
    tenantId: "",
    title: "",
    description: "",
    date: 0,
    location: "",
    capacity: 0,
    currentRegistrations: 0
  };
  static seedData: Event[] = [
    {
      id: "e1",
      tenantId: "t1",
      title: "Ramadan Community Iftar",
      description: "Join us for a community breaking of fast every Friday evening.",
      date: Date.now() + 86400000 * 7,
      location: "Social Hall",
      capacity: 200,
      currentRegistrations: 45
    }
  ];
}
export class EventRegistrationEntity extends IndexedEntity<EventRegistration> {
  static readonly entityName = "event_registration";
  static readonly indexName = "event_registrations";
  static readonly initialState: EventRegistration = {
    id: "",
    eventId: "",
    tenantId: "",
    name: "",
    email: "",
    phone: "",
    registeredAt: 0
  };
  static seedData: EventRegistration[] = [
    {
      id: "er1",
      eventId: "e1",
      tenantId: "t1",
      name: "Ahmad Fikri",
      email: "ahmad@example.com",
      phone: "081234567890",
      registeredAt: Date.now()
    }
  ];
}