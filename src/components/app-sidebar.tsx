import React from "react";
import { LayoutDashboard, Wallet, Package, Calendar, Settings, Users, LogOut } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/lib/store";
export function AppSidebar(): JSX.Element {
  const { slug } = useParams();
  const currentTenant = useAppStore(s => s.currentTenant);
  const user = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);
  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard, href: `/app/${slug}/dashboard` },
    { name: "Finance", icon: Wallet, href: `/app/${slug}/finance` },
    { name: "Inventory", icon: Package, href: `/app/${slug}/inventory` },
    { name: "Events", icon: Calendar, href: `/app/${slug}/events` },
    { name: "Members", icon: Users, href: `/app/${slug}/members` },
  ];
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="h-16 flex items-center px-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold font-display truncate w-32">
              {currentTenant?.name || "MasjidHub"}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {user?.role.replace('_', ' ') || "Admin"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild tooltip={item.name}>
                  <Link to={item.href} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to={`/app/${slug}/settings`} className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-destructive hover:text-destructive">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}