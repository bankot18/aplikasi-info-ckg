-- Schema Database CKG Puskesmas Banjaran Kota
-- Digunakan untuk Cloudflare D1 Serverless Database / PostgreSQL / SQLite

-- 1. Tabel Users & Akses Roles
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_user VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT '',
    role VARCHAR(50) DEFAULT 'Petugas',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Users
INSERT OR IGNORE INTO users (nama_user, password, role) VALUES 
('Mochamad Fauzie, S.Gz', '213', 'Admin'),
('Nurul Hidayah, Amd.Kes', '213', 'Koordinator'),
('Anisa Rohmatunisa, AM.Keb', '', 'Petugas'),
('Neng Yulia Trisnawati, AM.Keb', '', 'Petugas'),
('Teti Nuryati, S.Keb, Bdn', '', 'Petugas');

-- 2. Tabel Data SIMPUS Pasien
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

-- 3. Tabel Data Entry CKG (Skrining Kesehatan)
CREATE TABLE IF NOT EXISTS ckg_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal_entry VARCHAR(20) NOT NULL,
    nik VARCHAR(20) NOT NULL,
    nama_pasien VARCHAR(150) NOT NULL,
    petugas_entry VARCHAR(100) NOT NULL,
    lokasi_pelayanan VARCHAR(50) DEFAULT 'Luar Gedung',
    status_entry VARCHAR(50) DEFAULT 'Berhasil di Entry',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexing untuk Query Cepat di Cloudflare D1
CREATE INDEX IF NOT EXISTS idx_simpus_nik ON simpus_records(nik);
CREATE INDEX IF NOT EXISTS idx_simpus_assigned ON simpus_records(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ckg_nik ON ckg_records(nik);

-- 4. Tabel Recycle Data (Tempat Sampah Data Terhapus)
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

-- 5. Tabel Announcement (Pengumuman Sistem)
CREATE TABLE IF NOT EXISTS announcement (
    id INTEGER PRIMARY KEY DEFAULT 1,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    date TEXT,
    active INTEGER DEFAULT 1
);

-- Insert Default Announcement if not exists
INSERT OR IGNORE INTO announcement (id, title, content, author, date, active) VALUES
(1, 'PENGUMUMAN SISTEM CKG', 'Selamat datang di Sistem Informasi Pencatatan CKG Puskesmas Banjaran Kota. Harap lakukan verifikasi data pasien By Name By Address (BNBA) dengan cermat dan akurat.', 'Admin Utama', '2026-08-06', 1);

