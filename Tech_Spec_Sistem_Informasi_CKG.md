# Technical Specification Document (TSD)
**Sistem Informasi Pencatatan CKG (Calon Keluarga Gizi/Kesehatan) Puskesmas**

---

## 1. System Architecture Overview
Aplikasi ini menggunakan arsitektur *Serverless* sepenuhnya yang di-hosting pada ekosistem Cloudflare. Pendekatan ini memisahkan antara *Client-side* (Front-end) dan *Server-side* (Back-end/API), dengan performa latensi rendah (*Edge Computing*).

*   **Front-end:** React.js / Vite (Static Export), *styling* menggunakan **Tailwind CSS**.
*   **Back-end (API):** Cloudflare Workers menggunakan *framework* Hono.js (sangat ringan dan kompatibel dengan Edge).
*   **Database:** Cloudflare D1 (Serverless SQLite).
*   **Deployment:** Cloudflare Pages (untuk FE) & Cloudflare Workers (untuk BE).

---

## 2. UI/UX & Front-end Technical Implementation

### 2.1. Desain Sistem & Komponen Visual
*   **Layout Utama:** Menggunakan pola **Sidebar Navigation** dinamis yang dapat meminimalkan diri (collapsible) di perangkat *mobile*.
*   **Visual Style:** Penerapan **Glassmorphism** (efek *backdrop-blur* dan transparansi latar belakang yang halus) pada komponen *Card*, *Modal/Pop-up*, dan *Navbar* untuk memberikan kesan antarmuka profesional dan modern.
*   **Data Visualization:** Dashboard Koordinator akan menggunakan *library* grafik ringan (seperti Recharts atau Chart.js) untuk me-render:
    *   **Bar Chart:** Distribusi status gizi (IMT) per wilayah.
    *   **Line Chart:** Tren penemuan kasus (Gula darah tinggi/Hipertensi) per bulan.
    *   **Radar Chart:** Pemetaan multi-variabel (Kesehatan Fisik: Mata, Telinga, Gigi) secara komprehensif.

### 2.2. Automasi Logika Front-end (Client-Side)
Untuk mempermudah dan mempercepat *entry* data oleh petugas:
*   **Kalkulasi Usia:** 
    `Math.floor((new Date() - new Date(tanggal_lahir).getTime()) / 3.15576e+10)`
*   **Kalkulasi IMT & Kategori:**
    `IMT = Berat Badan (kg) / (Tinggi Badan (m) * Tinggi Badan (m))`
    *   `< 18.5`: Kurus (Kuning)
    *   `18.5 - 24.9`: Normal (Hijau)
    *   `25.0 - 29.9`: Gemuk (Oranye)
    *   `>= 30`: Obesitas (Merah)
*   **Conditional Formatting Tabel:** Pada komponen tabel rendering, injeksi kelas CSS (Tailwind) dinamis `bg-red-100 text-red-800` jika nilai `TD_SISTOLIK > 140` atau `GULA_DARAH > 200`.
*   **Cascading Dropdown API:** Menghubungkan dropdown Provinsi -> Kab/Kota -> Kecamatan -> Kelurahan menggunakan API Wilayah Indonesia (misal: API dari *cahyadsn/wilayah* atau *Emsifa*).

---

## 3. Database Schema (Cloudflare D1 - SQLite)

Berikut adalah struktur tabel relasional utama.

### Table: `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `username` | TEXT | UNIQUE, NOT NULL | Username login |
| `password_hash` | TEXT | NOT NULL | Bcrypt hashed password |
| `role` | TEXT | NOT NULL | Enum: 'admin', 'koordinator', 'petugas' |
| `nama_petugas` | TEXT | NOT NULL | Nama asli petugas |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu akun dibuat |

### Table: `ckg_records`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `jenis_kegiatan` | TEXT | NOT NULL | Enum: 'Dalam Gedung', 'Luar Gedung' |
| `nik` | TEXT | NOT NULL, length=16 | NIK Pasien (Index) |
| `nama` | TEXT | NOT NULL | Nama Pasien |
| `tanggal_lahir` | DATE | NOT NULL | Format: YYYY-MM-DD |
| `usia` | INTEGER | NOT NULL | Hasil auto-kalkulasi FE disave ke DB |
| `jenis_kelamin` | TEXT | NOT NULL | Enum: 'L', 'P' |
| `no_whatsapp` | TEXT | | Opsional |
| `status_pernikahan`| TEXT | | Belum Kawin/Kawin/Cerai Hidup/Mati |
| `provinsi` | TEXT | NOT NULL | Data wilayah |
| `kab_kota` | TEXT | NOT NULL | Data wilayah |
| `kecamatan` | TEXT | NOT NULL | Data wilayah |
| `kelurahan` | TEXT | NOT NULL | Data wilayah |
| `alamat` | TEXT | NOT NULL | Alamat lengkap |
| `pekerjaan` | TEXT | | |
| `merokok` | TEXT | NOT NULL | Enum: 'Ya', 'Tidak' |
| `bb` | REAL | NOT NULL | Berat Badan (kg) |
| `tb` | REAL | NOT NULL | Tinggi Badan (cm) |
| `lp` | REAL | | Lingkar Perut (cm) |
| `imt` | REAL | NOT NULL | Indeks Massa Tubuh |
| `td_sistolik` | INTEGER | | Tekanan Darah Sistolik |
| `td_diastolik` | INTEGER| | Tekanan Darah Diastolik |
| `gula_darah` | INTEGER | | Kolesterol mg/dL |
| `kolesterol` | INTEGER | | Gula Darah mg/dL |
| `hb` | REAL | | Hemoglobin g/dL |
| `telinga` | TEXT | | Normal/Kelainan |
| `mata` | TEXT | | Normal/Kelainan |
| `gigi` | TEXT | | Normal/Kelainan |
| `katarak` | TEXT | | Enum: 'Ya', 'Tidak' |
| `created_by` | TEXT | FOREIGN KEY | ID user yang menginput |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp entry |

---

## 4. API Specification (Cloudflare Workers)

Seluruh *endpoints* diawali dengan `/api/v1`. Request dan Response menggunakan format `application/json`.

### 4.1. Authentication
*   **POST** `/auth/login`
    *   **Body:** `{ "username": "...", "password": "..." }`
    *   **Response:** `{ "token": "JWT_TOKEN", "role": "admin" }`

### 4.2. CKG Records Management
*   **POST** `/records`
    *   **Auth:** Bearer Token (Semua Role)
    *   **Body:** Seluruh field pada form BNBA.
*   **GET** `/records`
    *   **Auth:** Bearer Token
    *   **Query Params:** `?page=1&limit=50&kegiatan=Luar Gedung&search=Nama/NIK`
    *   **Logic Role:** Jika role `petugas`, hanya kembalikan record dimana `created_by = user_id`. Jika `admin/koordinator`, kembalikan semua.
*   **PUT** `/records/:id`
    *   **Auth:** Bearer Token (Petugas pembuat record / Admin)
*   **DELETE** `/records/:id`
    *   **Auth:** Bearer Token (Hanya Admin)

### 4.3. Dashboard & Analytics (Khusus Koordinator & Admin)
*   **GET** `/dashboard/summary`
    *   **Auth:** Bearer Token (Admin, Koordinator)
    *   **Response:** Mengembalikan agregasi data untuk grafik (total sasaran, sebaran IMT, persentase penyakit penyerta).

---

## 5. Security & Validation
1.  **JSON Web Token (JWT):** Autentikasi *stateless*, token disematkan di *header* otorisasi (`Authorization: Bearer <token>`).
2.  **Role-Based Access Control (RBAC):** *Middleware* pada Cloudflare Workers akan mencegat setiap *request* API dan memvalidasi `role` dari *payload* JWT sebelum memberikan akses ke endpoint spesifik (seperti Hapus Data yang hanya boleh diakses Admin).
3.  **Data Validation (Zod):** 
    *   Digunakan di *Front-end* (sebelum *submit*) dan *Back-end* (sebelum masuk D1) untuk memastikan integritas tipe data (misalnya NIK wajib 16 digit string numerik, BB/TB wajib angka desimal positif).
