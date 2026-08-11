-- ====================================================================
-- SCHEMA DATABASE CKG PUSKESMAS BANJARAN KOTA (CLOUDFLARE D1 DATABASE)
-- Struktur Tabel Lengkap Berdasarkan Setiap Menu Aplikasi CKG
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. MENU: ADMIN PANEL & DATABASE USER
-- Tabel: users (Pengelolaan User, Password, & Hierarchy Role)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_user VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT '',
    role VARCHAR(50) DEFAULT 'Petugas',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default User Accounts
INSERT OR IGNORE INTO users (nama_user, password, role) VALUES 
('Mochamad Fauzie, S.Gz', '213', 'Admin'),
('Nurul Hidayah, Amd.Kes', '213', 'Koordinator'),
('Anisa Rohmatunisa, AM.Keb', '', 'Petugas'),
('Neng Yulia Trisnawati, AM.Keb', '', 'Petugas'),
('Teti Nuryati, S.Keb, Bdn', '', 'Petugas');


-- --------------------------------------------------------------------
-- 2. LIVE SESSION TRACKER (STATUS ONLINE / OFFLINE USER REALTIME)
-- Tabel: user_sessions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
    nama_user TEXT PRIMARY KEY,
    last_seen INTEGER NOT NULL,
    status TEXT DEFAULT 'active'
);


-- --------------------------------------------------------------------
-- 3. MENU: DATA ENTRY CKG DARI SIMPUS
-- Tabel: simpus_records (Antrean Pasien SIMPUS, Bagi Petugas & Status Entry)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS simpus_records (
    id VARCHAR(50) PRIMARY KEY,
    no INTEGER NOT NULL,
    tanggal VARCHAR(20) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    nik VARCHAR(20) NOT NULL,
    alamat TEXT,
    dob VARCHAR(20),
    usia INTEGER DEFAULT 0,
    bb REAL DEFAULT 0,
    tb REAL DEFAULT 0,
    imt REAL DEFAULT 0,
    sistol INTEGER DEFAULT 0,
    diastol INTEGER DEFAULT 0,
    gula VARCHAR(50) DEFAULT '-',
    kolesterol VARCHAR(50) DEFAULT '-',
    keterangan VARCHAR(50) DEFAULT 'Dewasa',
    is_divided BOOLEAN DEFAULT 0,
    assigned_to VARCHAR(100) DEFAULT '',
    entry_status VARCHAR(50) DEFAULT 'belum',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_simpus_nik ON simpus_records(nik);
CREATE INDEX IF NOT EXISTS idx_simpus_assigned ON simpus_records(assigned_to);


-- --------------------------------------------------------------------
-- 4. MENU: DATA RECORDS CKG (Luar Gedung & Dalam Gedung)
-- Tabel: ckg_full_records (Penyimpanan Utama 28 Parameter Skrining & Medis CKG)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ckg_full_records (
    id TEXT PRIMARY KEY,
    nik TEXT NOT NULL,
    nama_pasien TEXT NOT NULL,
    petugas_entry TEXT NOT NULL,
    tanggal_entry TEXT NOT NULL,
    lokasi_pelayanan TEXT DEFAULT 'Luar Gedung',
    status_entry TEXT DEFAULT 'Terverifikasi',
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ckg_nik ON ckg_full_records(nik);
CREATE INDEX IF NOT EXISTS idx_ckg_petugas ON ckg_full_records(petugas_entry);
CREATE INDEX IF NOT EXISTS idx_ckg_tanggal ON ckg_full_records(tanggal_entry);


-- --------------------------------------------------------------------
-- 5. MENU: CKG SEKOLAH
-- Tabel: ckg_sekolah_records (Skrining Kesehatan Siswa Sekolah - Terpisah Dari Record CKG Utama & SIMPUS)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ckg_sekolah_records (
    id TEXT PRIMARY KEY,
    no INTEGER,
    nama TEXT NOT NULL,
    kelas TEXT,
    sekolah TEXT,
    jk TEXT DEFAULT 'L',
    nik TEXT,
    tanggal_lahir TEXT,
    no_whatsapp TEXT,
    provinsi TEXT DEFAULT 'Jawa Barat',
    kab_kota TEXT DEFAULT 'Kab. Bandung',
    kecamatan TEXT DEFAULT 'Banjaran',
    kelurahan TEXT DEFAULT 'Tarajusari',
    alamat TEXT,
    bb REAL DEFAULT 0,
    tb REAL DEFAULT 0,
    lp REAL DEFAULT 0,
    td_sistolik INTEGER DEFAULT 0,
    td_diastolik INTEGER DEFAULT 0,
    gula_darah TEXT DEFAULT '-',
    hb TEXT DEFAULT '-',
    karies TEXT DEFAULT 'Tidak',
    kebugaran TEXT DEFAULT 'Baik',
    menstruasi TEXT DEFAULT 'Belum',
    kacamata TEXT DEFAULT 'Tidak',
    petugas_entry TEXT DEFAULT 'Admin',
    tanggal_entry TEXT,
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- --------------------------------------------------------------------
-- 6. MENU: RECYCLE DATA (Tempat Sampah Data Terhapus)
-- Tabel: recycle_bin
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recycle_bin (
    id VARCHAR(100) PRIMARY KEY,
    nik VARCHAR(50),
    nama VARCHAR(150),
    jenis_kegiatan VARCHAR(50),
    deleted_at VARCHAR(50),
    deleted_by VARCHAR(100),
    original_source VARCHAR(100),
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- --------------------------------------------------------------------
-- 7. PENGUMUMAN SISTEM CKG (Banner Announcement Top Header)
-- Tabel: announcement
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcement (
    id INTEGER PRIMARY KEY DEFAULT 1,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    date TEXT,
    active INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO announcement (id, title, content, author, date, active) VALUES
(1, 'PENGUMUMAN SISTEM CKG', 'Selamat datang di Sistem Informasi Pencatatan CKG Puskesmas Banjaran Kota. Harap lakukan verifikasi data pasien By Name By Address (BNBA) dengan cermat dan akurat.', 'Admin Utama', '2026-08-06', 1);
