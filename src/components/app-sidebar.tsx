import React from "react";
import { LayoutDashboard, Wallet, Package, Calendar, Settings, Users, LogOut, ShieldCheck, HeartPulse, MessageSquare, Search, QrCode } from "lucide-react";
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
import { useAppStore, useUserRole, useUserName, useTenantName, useAppActions } from "@/lib/store";
export function AppSidebar(): JSX.Element {
  const { slug } = useParams();
  const tenantName = useTenantName();
  const userRole = useUserRole();
  const userName = useUserName();
  const actions = useAppStore(s => s.actions);
  const logout = actions.logout;
  const isSuper = userRole === 'superadmin_platform';
  const isAdminOrAmil = userRole === 'dkm_admin' || userRole === 'amil_zakat' || isSuper;
  const navigation = [
    { name: "Dasbor", icon: LayoutDashboard, href: `/app/${slug}/dashboard`, show: true },
    { name: "Keuangan", icon: Wallet, href: `/app/${slug}/finance`, show: isAdminOrAmil },
    { name: "ZIS Module", icon: HeartPulse, href: `/app/${slug}/zis`, show: isAdminOrAmil },
    { name: "Laporan ZIS", icon: FileText, href: `/app/${slug}/zis/report`, show: isAdminOrAmil },
    { name: "Pembayaran ZIS", icon: CreditCard, href: `/app/${slug}/zis/payment`, show: true },
    { name: "Inventaris", icon: Package, href: `/app/${slug}/inventory`, show: isAdminOrAmil },
    { name: "Jadwal Sholat", icon: Calendar, href: `/app/${slug}/jadwal-sholat`, show: isAdminOrAmil },
    { name: "Pengumuman", icon: MessageSquare, href: `/app/${slug}/notifikasi`, show: isAdminOrAmil },
    { name: "Konsultasi Ustadz", icon: MessageSquare, href: `/app/${slug}/chat-ustadz`, show: true },
    { name: "Pencarian", icon: Search, href: `/app/${slug}/search`, show: true },
    { name: "QR Code", icon: QrCode, href: `/app/${slug}/qr-code`, show: isAdminOrAmil },
    { name: "Kegiatan", icon: Calendar, href: `/app/${slug}/events`, show: true },
    { name: "Forum Ummat", icon: MessageSquare, href: `/app/${slug}/forum`, show: true },
    { name: "Anggota", icon: Users, href: `/app/${slug}/members`, show: isAdminOrAmil },
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
              {tenantName || "MasjidHub"}
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">
              {userRole?.replace('_', ' ') || "Guest"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isSuper && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Link to="/super-admin/dashboard" className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-bold">Platform Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarMenu>
            {navigation.filter(i => i.show).map((item) => (
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
          <div className="px-2 pb-2 mb-2 border-b">
            <p className="text-[10px] text-muted-foreground">Masuk sebagai</p>
            <p className="text-xs font-bold truncate">{userName || "Anonim"}</p>
          </div>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to={`/app/${slug}/settings`} className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span>Pengaturan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-destructive hover:text-destructive">
              <LogOut className="h-5 w-5" />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}