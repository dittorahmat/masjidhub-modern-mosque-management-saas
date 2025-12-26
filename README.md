# MasjidHub - Modern Mosque Management SaaS
MasjidHub adalah platform SaaS (Software as a Service) multi-tenant yang dirancang khusus untuk digitalisasi operasional masjid dan komunitas muslim. Platform ini memungkinkan setiap masjid memiliki portal digital eksklusif dengan isolasi data yang kuat.
## Fitur Utama
- **Multi-Tenant Architecture**: Setiap masjid (tenant) mendapatkan subdomain/slug unik dan isolasi data total menggunakan Cloudflare Durable Objects.
- **Modul Keuangan Transparan**: Pencatatan arus kas, infaq jumat, dan pengeluaran operasional dengan laporan otomatis.
- **Manajemen ZIS (Zakat, Infaq, Shadaqah)**: Modul khusus amil untuk pengelolaan zakat fitrah, zakat maal, dan penyaluran mustahik.
- **Forum Ummat & Moderasi**: Ruang diskusi internal jamaah untuk menjaga komunikasi komunitas tetap kondusif.
- **Manajemen Inventaris**: Pelacakan aset masjid (Sound system, AC, Karpet) dengan riwayat kondisi.
- **Portal Publik & Registrasi Kegiatan**: Halaman landing untuk jamaah untuk melihat jadwal kajian dan mendaftar kegiatan secara online.
- **Role-Based Access Control (RBAC)**: Pembagian tugas yang jelas antara DKM Admin, Amil Zakat, Ustadz, dan Jamaah.
## Teknologi
- **Frontend**: React, TypeScript, Tailwind CSS (Illustrative Theme), Framer Motion, Recharts.
- **Backend**: Hono (Worker), Cloudflare Durable Objects (State Persistence).
- **State Management**: Zustand (Multi-field primitive selectors).
- **UI Components**: Radix UI (Shadcn/UI).
## Akses Pengujian
- **Super Admin (Platform Admin)**:
  - Email: `admin@masjidhub.com`
  - Digunakan untuk menyetujui (Approve) pendaftaran masjid baru.
- **Mosque Admin (Demo)**:
  - Gunakan email demo `demo@masjid.org` pada halaman Login atau klik link "Coba Demo" di Landing Page.
## Strategi Isolasi Data
Setiap entitas (Tenant, Transaction, User) disimpan dalam **Cloudflare Durable Objects** yang dikelola melalui library `IndexedEntity`. Ini memastikan:
1. **Strong Consistency**: Data keuangan selalu akurat dan tersinkronisasi.
2. **Security**: Data satu masjid tidak dapat diakses oleh masjid lain karena pemisahan kunci penyimpanan di level Durable Object.