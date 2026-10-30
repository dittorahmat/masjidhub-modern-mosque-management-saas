import {
  LayoutDashboard,
  Wallet,
  Package,
  Calendar,
  Users,
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
  ImageIcon,
  Video,
  LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
  show?: boolean;
}

export function getAppNavigation(slug?: string, userRole?: string): NavigationItem[] {
  const isSuper = userRole === 'superadmin_platform';
  const isAdminOrAmil =
    userRole === 'dkm_admin' ||
    userRole === 'amil_zakat' ||
    userRole === 'ustadz' ||
    isSuper;

  return [
    { name: 'Executive Dashboard', icon: LayoutDashboard, href: `/app/${slug}/dashboard`, show: true },
    { name: 'Shared Inbox', icon: Sparkles, href: `/app/${slug}/inbox`, show: isAdminOrAmil },
    { name: 'Pusat Kendali AI', icon: BrainCircuit, href: `/app/${slug}/knowledge`, show: isAdminOrAmil },
    { name: 'Puzzle Builder', icon: LayoutTemplate, href: `/app/${slug}/builder`, show: isAdminOrAmil },
    { name: 'Rekaman Kajian', icon: Video, href: `/app/${slug}/kajian-videos`, show: true },
    { name: 'Kajian & Blog', icon: BookOpen, href: `/app/${slug}/blog`, show: isAdminOrAmil },
    { name: 'Media & Galeri', icon: ImageIcon, href: `/app/${slug}/media`, show: isAdminOrAmil },
    { name: 'Keuangan', icon: Wallet, href: `/app/${slug}/finance`, show: isAdminOrAmil },
    { name: 'ZIS Module', icon: HeartPulse, href: `/app/${slug}/zis`, show: isAdminOrAmil },
    { name: 'Laporan ZIS', icon: FileText, href: `/app/${slug}/zis/report`, show: isAdminOrAmil },
    { name: 'Pembayaran ZIS', icon: CreditCard, href: `/app/${slug}/zis/payment`, show: true },
    { name: 'Donasi QRIS', icon: QrCode, href: `/app/${slug}/qris`, show: true },
    { name: 'Inventaris', icon: Package, href: `/app/${slug}/inventory`, show: isAdminOrAmil },
    { name: 'Jadwal Sholat', icon: Calendar, href: `/app/${slug}/jadwal-sholat`, show: isAdminOrAmil },
    { name: 'Pengumuman', icon: MessageSquare, href: `/app/${slug}/notifikasi`, show: isAdminOrAmil },
    { name: 'Pencarian', icon: Search, href: `/app/${slug}/search`, show: true },
    { name: 'QR Code', icon: QrCode, href: `/app/${slug}/qr-code`, show: isAdminOrAmil },
    { name: 'Struktur Organisasi', icon: Users, href: `/app/${slug}/organization`, show: isAdminOrAmil },
    { name: 'Kegiatan', icon: Calendar, href: `/app/${slug}/events`, show: true },
    { name: 'Forum Ummat', icon: MessageSquare, href: `/app/${slug}/forum`, show: true },
    { name: 'Anggota', icon: Users, href: `/app/${slug}/members`, show: isAdminOrAmil },
  ];
}

export function getRoleBottomTabs(slug?: string, role?: string): NavigationItem[] {
  switch (role) {
    case 'amil_zakat':
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: `/app/${slug}/dashboard` },
        { name: 'ZIS', icon: HeartPulse, href: `/app/${slug}/zis` },
        { name: 'Mustahik', icon: Users, href: `/app/${slug}/zis?tab=mustahik` },
        { name: 'Distribusi', icon: Wallet, href: `/app/${slug}/zis?tab=distribution` },
      ];
    case 'ustadz':
    case 'jamaah':
      return [
        { name: 'Jadwal', icon: Calendar, href: `/app/${slug}/jadwal-sholat` },
        { name: 'Kajian', icon: Video, href: `/app/${slug}/kajian-videos` },
        { name: 'Kegiatan', icon: Calendar, href: `/app/${slug}/events` },
        { name: 'Forum', icon: MessageSquare, href: `/app/${slug}/forum` },
      ];
    case 'superadmin_platform':
    case 'dkm_admin':
    default:
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: `/app/${slug}/dashboard` },
        { name: 'Kas', icon: Wallet, href: `/app/${slug}/finance` },
        { name: 'ZIS', icon: HeartPulse, href: `/app/${slug}/zis` },
        { name: 'Kegiatan', icon: Calendar, href: `/app/${slug}/events` },
      ];
  }
}
