-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_user VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT '',
    role VARCHAR(50) DEFAULT 'Petugas',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Data SIMPUS & CKG Pasien
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

-- 3. Tabel Riwayat Entri CKG
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

-- Indexing untuk Kecepatan Query
CREATE INDEX IF NOT EXISTS idx_simpus_nik ON simpus_records(nik);
CREATE INDEX IF NOT EXISTS idx_simpus_assigned ON simpus_records(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ckg_nik ON ckg_records(nik);
