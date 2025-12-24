import { IndexedEntity } from "./core-utils";
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: number;
  address?: string;
  bankInfo?: string;
}
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
    createdAt: 0 
  };
  static seedData: Tenant[] = [
    { 
      id: "t1", 
      name: "Masjid Al-Hikmah", 
      slug: "al-hikmah", 
      ownerId: "u1", 
      createdAt: Date.now() 
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