# 🚀 Panduan Deploy Aplikasi CKG ke Cloudflare Pages & D1 Database

Panduan lengkap untuk mempublikasikan **Sistem Informasi CKG Puskesmas Banjaran Kota** ke **Cloudflare Pages** secara gratis, cepat, dan aman dengan domain khusus (e.g., `ckgbankot.web.id`).

---

## 📋 Ringkasan Arsitektur
- **Frontend & App Logic**: Cloudflare Pages (Static Assets + Single Page Application)
- **Database Storage**:
  - **Cloud Sync**: Cloudflare Pages Functions (`/api/simpus`, `/api/users`) yang terhubung langsung secara real-time ke **Cloudflare D1 Database** (`ckg_database`). Data otomatis sinkron di semua HP/device petugas!
  - **Offline Fallback**: LocalStorage + Fitur Import/Export XLSX terintegrasi saat offline.
- **Dukcapil Service**: Dual-Engine (Automated Spring Boot 8081 Connector + Fallback Local NIK Parser).

---

## 🎯 CARA 1: Deploy via Cloudflare Dashboard (Sangat Direkomendasikan & Tanpa Terminal)

### Langkah 1: Push Kode ke GitHub / GitLab
1. Upload folder project ini ke repository GitHub Anda (misal: `aplikasi-info-ckg`).

### Langkah 2: Hubungkan ke Cloudflare Pages
1. Buka [Dash Cloudflare](https://dash.cloudflare.com/) dan login.
2. Di menu sebelah kiri, klik **Workers & Pages** -> **Create Application**.
3. Pilih tab **Pages** -> Klik **Connect to Git**.
4. Pilih repository GitHub `aplikasi-info-ckg`.

### Langkah 3: Pengaturan Build (Build Settings)
- **Project name**: `aplikasi-info-ckg`
- **Production branch**: `main` (atau `master`)
- **Framework preset**: `None` (Static HTML)
- **Build command**: *(Kosongkan)*
- **Build output directory**: `.` (titik atau kosongkan)
- Klik **Save and Deploy**.

> ✨ **Selesai!** Aplikasi Anda langsung aktif dalam beberapa detik di URL:  
> `https://aplikasi-info-ckg.pages.dev`

---

## 🌐 Menghubungkan Custom Domain (misal: `ckgbankot.web.id`)
1. Di Dashboard Cloudflare Pages project Anda, buka tab **Custom domains**.
2. Klik **Set up a custom domain**.
3. Masukkan nama domain Anda: `ckgbankot.web.id` atau subdomain pilihan Anda.
4. Cloudflare akan secara otomatis mengatur SSL/TLS HTTPS gratis.

---

## 🛠 CARA 2: Deploy via CLI (Wrangler Command Line)

Jika Anda ingin deploy langsung dari komputer via Command Prompt / PowerShell:

```bash
# 1. Login ke Cloudflare
npx wrangler login

# 2. Deploy ke Cloudflare Pages
npx wrangler pages deploy . --project-name=aplikasi-info-ckg
```

---

## 🗄 3. Pengaturan Database (Cloudflare D1 Database - Opsional)

Aplikasi CKG sudah memiliki sistem database **Offline-First** berbasis browser dengan fitur **Import & Export XLSX (SheetJS)** yang otomatis tersimpan aman di browser.

Jika Anda ingin menggunakan **Cloudflare D1 (Database SQL Terpusat)**:

1. Buat D1 Database di Cloudflare:
   ```bash
   npx wrangler d1 create ckg_database
   ```
2. Eksekusi skema database `schema.sql`:
   ```bash
   npx wrangler d1 execute ckg_database --file=./schema.sql
   ```
3. Hubungkan ID Database ke file `wrangler.toml`.

---

## ✅ Fitur yang Siap Dipublish:
- [x] Detail Info SIMPUS Interaktif & Click-to-Copy Data Pasien
- [x] Import File XLSX Pasien SIMPUS (beserta Download Template `.xlsx`)
- [x] Ekspor XLSX Per Petugas & Ekspor Semua Data Pasien
- [x] Bagi Data Pasien ke Petugas
- [x] Layanan Verifikasi KTP Dukcapil (Dual Engine: Server 8081 + Local Parser)
- [x] Manajemen User & Role (Admin, Koordinator, Petugas)
