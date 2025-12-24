import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useUserId, useUserRole, useAppActions } from '@/lib/store';
import { SidebarProvider, SidebarInset, SidebarTrigger, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Building2, Users, LogOut, ShieldCheck, ArrowLeft } from 'lucide-react';
export default function SuperAdminLayout() {
  const userId = useUserId();
  const userRole = useUserRole();
  const actions = useAppActions();
  const logout = actions.logout;
  const location = useLocation();
  if (!userId || userRole !== 'superadmin_platform') {
    return <Navigate to="/" replace />;
  }
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/super-admin/dashboard' },
    { name: 'Mosques', icon: Building2, href: '/super-admin/tenants' },
    { name: 'Global Users', icon: Users, href: '/super-admin/users' },
  ];
  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader className="h-16 flex items-center px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-destructive flex items-center justify-center text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold font-display">Super Admin</span>
              <span className="text-[10px] text-muted-foreground">Platform Governance</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="p-2 space-y-1">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                  <Link to={item.href} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t space-y-2">
          <SidebarMenuButton asChild variant="outline">
            <Link to="/app/al-hikmah/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Exit to Mosque</span>
            </Link>
          </SidebarMenuButton>
          <SidebarMenuButton onClick={logout} className="text-destructive hover:text-destructive">
            <LogOut className="h-5 w-5 mr-2" />
            <span>Sign Out</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="h-16 border-b flex items-center px-4 justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-[1px] bg-border" />
            <h2 className="font-display font-bold text-lg">MasjidHub Platform Console</h2>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}