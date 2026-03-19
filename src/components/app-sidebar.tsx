import React from "react";
import { 
  LayoutDashboard, 
  Wallet, 
  Package, 
  Calendar, 
  Settings, 
  Users, 
  LogOut, 
  ShieldCheck, 
  HeartPulse, 
  MessageSquare, 
  Search, 
  QrCode, 
  FileText, 
  CreditCard,
  Sparkles,
  BrainCircuit,
  LayoutTemplate,
  BookOpen,
  ImageIcon
} from "lucide-react";
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
import { useAppStore, useUserRole, useUserName, useTenantName } from "@/lib/store";

export function AppSidebar(): JSX.Element {
  const { slug } = useParams();
  const tenantName = useTenantName();
  const userRole = useUserRole();
  const userName = useUserName();
  const actions = useAppStore(s => s.actions);
  const logout = actions.logout;
  
  const isSuper = userRole === 'superadmin_platform';
  // Include Ustadz in the admin-level navigation access
  const isAdminOrAmil = userRole === 'dkm_admin' || userRole === 'amil_zakat' || userRole === 'ustadz' || isSuper;

  const navigation = [
    { name: "Executive Dashboard", icon: LayoutDashboard, href: `/app/${slug}/dashboard`, show: true },
    { name: "Shared Inbox", icon: Sparkles, href: `/app/${slug}/inbox`, show: isAdminOrAmil },
    { name: "Pusat Kendali AI", icon: BrainCircuit, href: `/app/${slug}/knowledge`, show: isAdminOrAmil },
    { name: "Puzzle Builder", icon: LayoutTemplate, href: `/app/${slug}/builder`, show: isAdminOrAmil },
    { name: "Kajian & Blog", icon: BookOpen, href: `/app/${slug}/blog`, show: isAdminOrAmil },
    { name: "Media & Galeri", icon: ImageIcon, href: `/app/${slug}/media`, show: isAdminOrAmil },
    { name: "Keuangan", icon: Wallet, href: `/app/${slug}/finance`, show: isAdminOrAmil },
    { name: "ZIS Module", icon: HeartPulse, href: `/app/${slug}/zis`, show: isAdminOrAmil },
    { name: "Laporan ZIS", icon: FileText, href: `/app/${slug}/zis/report`, show: isAdminOrAmil },
    { name: "Pembayaran ZIS", icon: CreditCard, href: `/app/${slug}/zis/payment`, show: true },
    { name: "Inventaris", icon: Package, href: `/app/${slug}/inventory`, show: isAdminOrAmil },
    { name: "Jadwal Sholat", icon: Calendar, href: `/app/${slug}/jadwal-sholat`, show: isAdminOrAmil },
    { name: "Pengumuman", icon: MessageSquare, href: `/app/${slug}/notifikasi`, show: isAdminOrAmil },
    { name: "Pencarian", icon: Search, href: `/app/${slug}/search`, show: true },
    { name: "QR Code", icon: QrCode, href: `/app/${slug}/qr-code`, show: isAdminOrAmil },
    { name: "Struktur Organisasi", icon: Users, href: `/app/${slug}/organization`, show: isAdminOrAmil },
    { name: "Kegiatan", icon: Calendar, href: `/app/${slug}/events`, show: true },
    { name: "Forum Ummat", icon: MessageSquare, href: `/app/${slug}/forum`, show: true },
    { name: "Anggota", icon: Users, href: `/app/${slug}/members`, show: isAdminOrAmil },
  ];

  return (
    <Sidebar className="border-r border-stone-200/60 bg-stone-50/50 backdrop-blur-xl">
      <SidebarHeader className="h-20 flex items-center px-6 border-b border-stone-200/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black font-display truncate w-32 tracking-tight italic">
              {tenantName || "MasjidHub"}
            </span>
            <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">
              {userRole?.replace('_', ' ') || "Guest"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        {isSuper && (
          <SidebarGroup className="mb-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl h-12 transition-all border border-red-100">
                  <Link to="/super-admin/dashboard" className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-black text-xs uppercase tracking-widest">Platform Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {navigation.filter(i => i.show).map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild tooltip={item.name} className="rounded-xl h-11 px-4 hover:bg-white hover:shadow-sm transition-all group data-[active=true]:bg-white data-[active=true]:shadow-md data-[active=true]:text-primary border-transparent border hover:border-stone-200/40">
                  <Link to={item.href} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <span className="font-bold text-sm tracking-tight">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6 border-t border-stone-200/40 bg-stone-100/30">
        <SidebarMenu className="gap-4">
          <div className="px-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest mb-1">Masuk sebagai</p>
            <p className="text-sm font-black text-slate-800 truncate">{userName || "Anonim"}</p>
          </div>
          <div className="flex flex-col gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="rounded-xl h-10 hover:bg-white transition-all font-bold text-xs gap-3">
                <Link to={`/app/${slug}/settings`}>
                  <Settings className="h-4 w-4 opacity-40" />
                  <span>Pengaturan</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} className="rounded-xl h-10 hover:bg-red-50 text-stone-500 hover:text-red-600 transition-all font-bold text-xs gap-3">
                <LogOut className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                <span>Keluar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
