# Product Requirements Document (PRD)
**Nama Produk:** Sistem Informasi Pencatatan CKG (Calon Keluarga Gizi/Kesehatan) Puskesmas  
**Platform:** Web Application  
**Fokus Utama:** Pencatatan By Name By Address (BNBA) Dalam Gedung & Luar Gedung  

---

## 1. Ringkasan Eksekutif
Sistem Informasi Pencatatan CKG adalah aplikasi berbasis web yang dirancang khusus untuk digitalisasi data skrining kesehatan di Puskesmas. Sistem ini memfasilitasi pencatatan data BNBA secara komprehensif untuk dua jenis kegiatan utama:
*   **Dalam Gedung:** Pelayanan dan skrining CKG yang dilakukan di dalam fasilitas Puskesmas.
*   **Luar Gedung:** Kegiatan skrining yang dilakukan di luar fasilitas (misalnya kunjungan lapangan, Posbindu, atau penyuluhan komunitas).

Aplikasi ini dirancang dengan antarmuka modern yang bersih (seperti implementasi *sidebar navigation* dan efek *glassmorphism* pada komponen tertentu) untuk memberikan pengalaman pengguna yang intuitif bagi petugas lapangan maupun manajemen.

## 2. Target Pengguna & Hak Akses (Role)
Sistem memiliki tiga tingkatan pengguna dengan hierarki hak akses sebagai berikut:

1.  **Admin (God User)**
    *   Memiliki kontrol penuh terhadap seluruh sistem.
    *   Manajemen master data (pengguna, wilayah, daftar Puskesmas/faskes).
    *   Akses ke pengaturan sistem, pemulihan data, dan log aktivitas.
    *   Mampu melihat, mengedit, dan menghapus seluruh data entry dari semua pengguna.
2.  **Koordinator (Pemegang Program CKG)**
    *   Memantau capaian program CKG secara keseluruhan.
    *   Akses ke dashboard analitik dan visualisasi data kesehatan (grafik bar, line, radar) untuk pelaporan.
    *   Mampu mengunduh atau mengekspor laporan BNBA bulanan/tahunan.
    *   Memvalidasi data yang telah diinput oleh Petugas Entry.
3.  **Petugas Entry (Data Entry CKG)**
    *   Akses terbatas pada formulir input data BNBA.
    *   Hanya dapat melihat dan mengedit data yang mereka input sendiri (atau sesuai wilayah tugasnya).
    *   Fokus pada kecepatan dan akurasi pengisian formulir.

## 3. Fitur Mempermudah User (UX Enhancements)
Untuk mempercepat proses pencatatan dan meminimalisir *human error*, sistem akan dilengkapi dengan fitur otomasi berikut:
*   **Auto-Kalkulasi Usia:** Usia akan terisi otomatis berdasarkan input `TANGGAL LAHIR`.
*   **Auto-Kalkulasi IMT (Indeks Massa Tubuh):** Nilai IMT otomatis dihitung saat petugas menginput `BB` (Berat Badan) dan `TB` (Tinggi Badan). Sistem juga akan memberikan label status otomatis (Kurus, Normal, Gemuk, Obesitas).
*   **Cascading Dropdown Wilayah:** Pilihan `PROVINSI`, `KAB/KOTA`, `KECAMATAN`, dan `KELURAHAN` akan saling terhubung (berjenjang) menggunakan API wilayah lokal, sehingga petugas tidak perlu mengetik manual.
*   **Indikator Warna (Conditional Formatting):** Pada tabel hasil, jika ada nilai yang tidak normal (misalnya Tensi Tinggi, Gula Darah Tinggi), *cell* tersebut akan otomatis berwarna merah/kuning untuk kemudahan identifikasi risiko oleh petugas gizi/kesehatan.
*   **Responsive & Mobile-Friendly:** Karena Petugas Entry sering berada "Luar Gedung", antarmuka dibangun responsif (menggunakan Tailwind CSS) agar mudah diakses via tablet atau *smartphone*.

## 4. Spesifikasi Data Input (Data Model)
Sesuai dengan format pelaporan, formulir pencatatan BNBA wajib memiliki kolom-kolom berikut:

### A. Informasi Lokasi & Kategori
*   **Kategori Kegiatan:** (Dropdown: Dalam Gedung / Luar Gedung)
*   **Lokasi Spesifik/Pos:** (Teks)

### B. Data Demografi Pasien
*   **NO:** Auto-increment
*   **NIK:** Teks (16 Digit, Validasi panjang karakter)
*   **NAMA:** Teks
*   **TANGGAL LAHIR:** Date Picker
*   **USIA:** Angka (Auto-calculated)
*   **JENIS KELAMIN:** Radio Button / Dropdown (L/P)
*   **NO WHATSAPP:** Teks (Numerik)
*   **STATUS PERNIKAHAN:** Dropdown (Belum Kawin, Kawin, Cerai Hidup, Cerai Mati)
*   **PROVINSI:** Dropdown API
*   **KAB/KOTA:** Dropdown API
*   **KECAMATAN:** Dropdown API
*   **KELURAHAN:** Dropdown API
*   **ALAMAT:** Teks Area
*   **PEKERJAAN:** Dropdown / Teks
*   **MEROKOK:** Radio Button (Ya / Tidak)

### C. Data Antropometri & Klinis
*   **BB (Berat Badan):** Angka (Desimal, kg)
*   **TB (Tinggi Badan):** Angka (Desimal, cm)
*   **LP (Lingkar Perut):** Angka (Desimal, cm)
*   **IMT:** Angka (Auto-calculated)
*   **TD SISTOLIK:** Angka (mmHg)
*   **TD DIASTOLIK:** Angka (mmHg)
*   **GULA DARAH:** Angka (mg/dL)
*   **KOLESTROL:** Angka (mg/dL)
*   **HB (Hemoglobin):** Angka (g/dL)

### D. Data Pemeriksaan Fisik Tambahan
*   **TELINGA:** Dropdown (Normal / Ada Kelainan)
*   **MATA:** Dropdown (Normal / Ada Kelainan)
*   **GIGI:** Dropdown (Normal / Ada Kelainan)
*   **KATARAK:** Radio Button (Ya / Tidak)

## 5. Arsitektur & Deployment (Cloudflare Ecosystem)
Seluruh infrastruktur aplikasi akan berjalan di atas ekosistem Cloudflare untuk memastikan performa yang cepat, aman, dan tanpa perlu mengelola server secara manual (*serverless*).

*   **Front-end (Client Side):** 
    *   Dideploy menggunakan **Cloudflare Pages**.
    *   Dibangun dengan framework modern (seperti React/Vue/Svelte) dan Tailwind CSS untuk menjamin UI/UX yang profesional, ringan, dan cepat.
*   **Back-end (API Server):**
    *   Dideploy menggunakan **Cloudflare Workers**.
    *   Workers akan menangani logika bisnis, otentikasi user (JWT/Session), dan routing data ke database dengan latensi sangat rendah di edge network.
*   **Database:**
    *   Menggunakan **Cloudflare D1** (Database relasional berbasis SQLite di edge Cloudflare).
    *   Sangat ideal untuk pencatatan tabular (seperti tabel di atas) dan memiliki skema relasional untuk tabel Users, CKG_Records, dan Master_Wilayah.

## 6. Target Tahapan Rilis
1.  **Fase 1:** Persiapan Database D1 & Mockup UI Form (Tailwind CSS).
2.  **Fase 2:** Pembuatan API Authentication (Cloudflare Workers) untuk 3 Role User.
3.  **Fase 3:** Integrasi Form Input BNBA dan fitur otomasi (Usia, IMT, Dropdown Wilayah).
4.  **Fase 4:** Pembuatan Dashboard untuk Koordinator & Deployment ke Cloudflare Pages.
