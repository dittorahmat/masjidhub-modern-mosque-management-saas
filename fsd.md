Tentu, ini adalah revisi **Functional Specification Document (FSD)** yang disesuaikan dengan arsitektur **Multi-Tenant (SaaS)**.

Dalam konsep ini, aplikasi Anda berfungsi sebagai **Platform**. Setiap masjid yang mendaftar adalah **Tenant** yang memiliki lingkungan data, URL (Subdomain), dan manajemen yang terisolasi total dari masjid lain.

---

# Functional Specification Document (FSD)
**Nama Proyek:** MasjidCloud (Platform Manajemen Masjid Multi-Tenant)
**Sifat Sistem:** Software as a Service (SaaS) / Multi-Tenant
**Platform:** Web (Subdomain per Masjid) & Mobile App (Multi-Account Support)
**Versi Dokumen:** 2.0

---

## 1. Pendahuluan

### 1.1 Deskripsi Sistem
Aplikasi ini adalah platform layanan terpusat yang memungkinkan banyak masjid memiliki sistem manajemen digital mereka sendiri. Setiap masjid akan memiliki alamat akses unik (contoh: `al-ikhlas.aplikasianda.com`) dan database operasional yang terpisah.

### 1.2 Prinsip Multi-Tenant (Data Isolation)
*   **Web Access:** Sistem mendeteksi masjid mana yang diakses berdasarkan subdomain URL.
*   **Mobile Access:** Saat pertama kali install, jamaah memilih masjid (via Pencarian atau Scan QR Code Masjid) untuk "masuk" ke lingkungan masjid tersebut.
*   **Data Privacy:** Data jamaah, keuangan, dan chat di Masjid A **tidak boleh** bocor atau terlihat oleh admin/jamaah Masjid B.

---

## 2. Aktor dan Hak Akses

Sistem kini memiliki tingkatan akses yang lebih kompleks:

### A. Level Platform (Pemilik Aplikasi)
1.  **Super Admin Platform:**
    *   Membuat/Menyetujui pendaftaran masjid baru.
    *   Mengatur paket berlangganan (jika ada).
    *   Melihat statistik global (Total semua masjid, total transaksi sistem).

### B. Level Masjid (Tenant)
1.  **Admin Masjid (DKM Utama):**
    *   Penguasa penuh atas data di subdomain masjidnya.
    *   Mengatur konfigurasi masjid (Nama, Logo, Rekening Bank).
2.  **Amil Zakat Masjid:** Mengelola ZIS khusus di masjid tersebut.
3.  **Ustadz Masjid:** Ustadz yang terdaftar di masjid tersebut (melayani konsultasi jamaah masjid tersebut).
4.  **Jamaah Masjid:** User yang terdaftar sebagai anggota komunitas masjid tersebut.

---

## 3. Spesifikasi Fungsional (Per Modul)

### 3.1 Modul Registrasi & Onboarding Masjid (Fitur Baru)
Ini adalah pintu gerbang bagi masjid untuk bergabung ke sistem.
*   **Pendaftaran Masjid:** Form input (Nama Masjid, Alamat, Email DKM, Dokumen Legalitas).
*   **Pemilihan Subdomain:** Masjid memilih URL unik (misal: `nurul-iman`). Sistem mengecek ketersediaan: `nurul-iman.aplikasianda.com`.
*   **Setup Awal:** Upload Logo Masjid, Struktur Organisasi, dan Rekening Bank Masjid.

### 3.2 Modul Pengolahan ZIS (Terisolasi per Masjid)
Data ZIS hanya milik masjid yang bersangkutan.
*   **Rekening Terpisah:** Pembayaran ZIS jamaah masuk langsung ke rekening masjid tersebut (bukan rekening penampung aplikasi), atau via Payment Gateway yang di-split settlement-nya.
*   **Database Mustahik Lokal:** Data fakir miskin yang dikelola adalah warga sekitar masjid tersebut.
*   **Laporan ZIS Lokal:** Laporan keuangan ZIS yang dihasilkan hanya mencakup transaksi di masjid tersebut.

### 3.3 Modul Manajemen Masjid
*   **Kas & Inventaris Lokal:** Pencatatan aset (AC, Karpet) dan arus kas operasional khusus untuk masjid tersebut.
*   **Jadwal Petugas:** Jadwal Imam/Khatib yang ditampilkan di aplikasi adalah spesifik untuk masjid tersebut.
*   **Broadcast Info:** Admin masjid bisa mengirim notifikasi "Push Notification" yang hanya diterima oleh jamaah yang mengikuti masjid tersebut.

### 3.4 Modul Forum Diskusi (Komunitas Lokal)
Forum ini bertindak sebagai jejaring sosial internal masjid.
*   **Lingkup Diskusi:** Thread/postingan yang dibuat oleh jamaah Masjid A hanya terlihat oleh jamaah Masjid A.
*   **Moderasi Lokal:** Admin/DKM Masjid A memiliki hak penuh menghapus postingan di forum mereka tanpa campur tangan admin platform.
*   **Kategori Lokal:** Masjid bisa membuat kategori unik sesuai kebutuhan warga (misal: "Kerja Bakti RW 05", "Info Kematian").

### 3.5 Modul Chat Ustadz
*   **Direktori Ustadz Lokal:** Jamaah hanya melihat daftar Ustadz yang telah didaftarkan/diundang oleh DKM masjid tersebut.
*   **Manajemen Konsultasi:** Chat log tersimpan di database masjid tersebut.

---

## 4. Arsitektur Teknis & Database

Ini adalah bagian terpenting untuk developer agar data terpisah.

### 4.1 Identifikasi Tenant (Masjid)
Setiap tabel di database **WAJIB** memiliki kolom `mosque_id` (Tenant ID) atau menggunakan skema database terpisah.

**Opsi Terbaik (Shared Database, Logic Separation):**
Menggunakan satu database besar, tetapi setiap query wajib menyertakan filter ID Masjid.
*   Tabel `users` -> ada kolom `mosque_id`
*   Tabel `transactions` -> ada kolom `mosque_id`
*   Tabel `forum_posts` -> ada kolom `mosque_id`

### 4.2 Handling Subdomain (Routing)
*   **Web:** Server membaca "Host Header".
    *   User akses `masjid-a.app.com` -> Backend set `current_mosque_id = 1`
    *   User akses `masjid-b.app.com` -> Backend set `current_mosque_id = 2`
*   **Mobile App:**
    *   App memanggil API endpoint `/api/v1/mosque-check?code=MASJID-A`.
    *   App menyimpan `mosque_id` di *local storage*.
    *   Setiap request berikutnya mengirimkan `mosque_id` di Header API.

---

## 5. Alur Pengguna (User Flow)

### A. Alur Pendaftaran Masjid Baru (Web)
1.  DKM membuka halaman utama platform (misal: `www.aplikasianda.com`).
2.  Klik "Daftarkan Masjid".
3.  Isi data & pilih subdomain (`al-hidayah`).
4.  Verifikasi email & Approval oleh Super Admin Platform.
5.  Masjid aktif -> Website masjid bisa diakses di `al-hidayah.aplikasianda.com`.

### B. Alur Jamaah (Mobile App)
1.  Jamaah download aplikasi dari Playstore.
2.  **Layar Awal:** "Cari Masjid Anda".
3.  Jamaah ketik "Al Hidayah" atau Scan QR Code di dinding masjid.
4.  App mengonfirmasi: "Anda akan bergabung ke Masjid Al Hidayah - Jakarta?"
5.  Jamaah Register/Login.
6.  Tampilan Home menyesuaikan konten Masjid Al Hidayah (Jadwal, Kas, Forum milik Al Hidayah).

---

## 6. Struktur Menu Aplikasi

### Web Dashboard (Tampilan Admin Masjid)
Admin login di `[subdomain].aplikasianda.com/admin`
1.  **Dashboard:** Statistik Masjid Sendiri.
2.  **Manajemen ZIS:** Input/Output Zakat Masjid.
3.  **Keuangan & Aset:** Kas Masjid & Inventaris.
4.  **Komunitas:**
    *   Kelola Forum (Hapus post, Ban user).
    *   Kelola Ustadz (Tambah/Edit akun Ustadz).
5.  **Pengaturan Masjid:** Ubah Logo, Slider Banner Aplikasi, Rekening Bank, Teks Running Text.

### Mobile App (Tampilan Jamaah)
1.  **Header:** Logo & Nama Masjid (Dinamis sesuai masjid yang dipilih).
2.  **Home:**
    *   Info Kas Masjid & ZIS (Real-time data masjid tersebut).
    *   Banner kegiatan masjid.
3.  **Fitur:**
    *   **Bayar ZIS:** Masuk ke rekening masjid tersebut.
    *   **Forum:** Feed diskusi warga masjid.
    *   **Tanya Ustadz:** List ustadz masjid.
4.  **Profil:**
    *   Opsi "Ganti Masjid" (Jika jamaah pindah rumah atau ingin donasi ke masjid lain).

---

## 7. Rencana Pengembangan (Roadmap)

1.  **Fase 1 (Core):** Multi-tenant setup, Manajemen Masjid Dasar, ZIS, & Subdomain routing.
2.  **Fase 2 (Social):** Forum Diskusi & Chat Ustadz.
3.  **Fase 3 (Expansion):** Aplikasi Mobile mendukung *Multi-Mosque* (Satu user bisa follow banyak masjid sekaligus tanpa logout-login).

---

Apakah struktur Multi-Tenant ini sudah sesuai dengan bayangan Anda? Jika ya, kita bisa lanjut membahas detail **database schema** untuk menangani pemisahan data ini.