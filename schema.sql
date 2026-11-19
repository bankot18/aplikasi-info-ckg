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
    imt REAL DEFAULT 0,
    status_imt TEXT DEFAULT 'Normal',
    td_sistolik INTEGER DEFAULT 0,
    td_diastolik INTEGER DEFAULT 0,
    gula_darah TEXT DEFAULT '-',
    hb TEXT DEFAULT '-',
    telinga TEXT DEFAULT 'Tidak ada serumen',
    gigi TEXT DEFAULT 'Tidak ada',
    mata TEXT DEFAULT 'Normal',
    kebugaran TEXT DEFAULT 'Baik',
    menstruasi TEXT DEFAULT 'Belum',
    kuku TEXT DEFAULT 'Pendek Bersih',
    merokok TEXT DEFAULT 'Tidak',
    jenis_rokok TEXT DEFAULT '-',
    intensitas_merokok TEXT DEFAULT '-',
    jumlah_batang TEXT DEFAULT '-',
    status_kesehatan TEXT DEFAULT 'Sehat',
    catatan_rujukan TEXT DEFAULT '-',
    is_examined BOOLEAN DEFAULT 0,
    identitas_done INTEGER DEFAULT 0,
    antro_done INTEGER DEFAULT 0,
    vital_done INTEGER DEFAULT 0,
    lab_done INTEGER DEFAULT 0,
    organ_done INTEGER DEFAULT 0,
    kesimpulan_done INTEGER DEFAULT 0,
    petugas_entry TEXT DEFAULT 'Admin',
    tanggal_entry TEXT,
    tahun_skrining TEXT DEFAULT '2026',
    ttd_logs TEXT DEFAULT '[]',
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sekolah_nama ON ckg_sekolah_records(nama);
CREATE INDEX IF NOT EXISTS idx_sekolah_instansi ON ckg_sekolah_records(sekolah);
CREATE INDEX IF NOT EXISTS idx_sekolah_kelas ON ckg_sekolah_records(kelas);
CREATE INDEX IF NOT EXISTS idx_sekolah_tahun ON ckg_sekolah_records(tahun_skrining);
CREATE INDEX IF NOT EXISTS idx_sekolah_nik ON ckg_sekolah_records(nik);
CREATE INDEX IF NOT EXISTS idx_sekolah_status ON ckg_sekolah_records(is_examined);


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

-- --------------------------------------------------------------------
-- 8. MENU: MASTER SARANA SEKOLAH (Khusus Admin)
-- Tabel: master_sekolah (Pengelolaan Data Sekolah: Tambah, Edit, Hapus)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_sekolah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL,
    password TEXT DEFAULT '',
    allowed_menus TEXT DEFAULT '',
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 8.1 MENU: MASTER POSYANDU & KADER (Khusus Admin)
-- Tabel: master_posyandu (Pengelolaan Akun & Hak Akses Posyandu)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_posyandu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL UNIQUE,
    desa TEXT NOT NULL,
    rw TEXT DEFAULT '',
    password TEXT DEFAULT '',
    allowed_menus TEXT DEFAULT '',
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO master_sekolah (nama, level) VALUES
('MI CHOIRUL HUDA', 'SD'),
('MI PERSIS 119 CIHAMERANG', 'SD'),
('MIS DARUSSALAM', 'SD'),
('MIS M. THREE', 'SD'),
('MIS MIFTAHUS SAADAH', 'SD'),
('MIS PERSIS 278 PANGKALAN', 'SD'),
('SDIT ZAKIA', 'SD'),
('SDN ARIASACANAGARA', 'SD'),
('SDN BANJARAN 01', 'SD'),
('SDN BANJARAN 02', 'SD'),
('SDN CIHAMERANG', 'SD'),
('SDN CIPEUNDEUY', 'SD'),
('SDN KIARAPAYUNG 01', 'SD'),
('SDN KIARAPAYUNG 02', 'SD'),
('SDN MEKARJAYA', 'SD'),
('SDN PANGAUBAN', 'SD'),
('SDN PASIRWARU', 'SD'),
('SDN PONDOKSIRAP', 'SD'),
('SDN SIRAH RANCA 01', 'SD'),
('SDN SIRAH RANCA 02', 'SD'),
('SDN TARAJUSARI', 'SD'),
('MTS DARUL HIKMAH AL - USMANI', 'SMP'),
('MTS PERSIS 282 CILEUTIK', 'SMP'),
('MTSS PERSIS BANJARAN', 'SMP'),
('MTSS MIFTAHUL HUDA KIARAPAYUNG', 'SMP'),
('MIFTAHUL HUDA KIARAPAYUNG', 'SMP'),
('SMP PASUNDAN 1 BANJARAN', 'SMP'),
('SMP PGRI BANJARAN', 'SMP'),
('SMP PGRI CIBARIBIS BANJARAN', 'SMP'),
('SMP TERPADU AL FALAH', 'SMP'),
('SMPN 1 BANJARAN', 'SMP'),
('SMPN 3 BANJARAN', 'SMP'),
('MAS PERSIS 31 BANJARAN', 'SMA'),
('SMA PASUNDAN BANJARAN', 'SMA'),
('SMAN 1 BANJARAN', 'SMA'),
('SMK KHARISMA NUSANTARA', 'SMA'),
('SMK PASUNDAN 1 BANJARAN', 'SMA'),
('SMK PASUNDAN 2 BANJARAN', 'SMA'),
('SMK PGRI CIBARIBIS', 'SMA'),
('SMK PLUS PRATAMA ADI', 'SMA');


-- --------------------------------------------------------------------
-- 9. MENU: ALAT & BNHP CKG (Inventaris Alat Medis & Logistik Bahan Habis Pakai)
-- Tabel: ckg_logistik_items, ckg_logistik_pemakaian, ckg_logistik_peminjaman
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ckg_logistik_items (
    id TEXT PRIMARY KEY,
    kode TEXT,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL DEFAULT 'BNHP',
    satuan TEXT NOT NULL DEFAULT 'Pcs',
    stok INTEGER NOT NULL DEFAULT 0,
    stok_min INTEGER NOT NULL DEFAULT 10,
    batch_no TEXT DEFAULT '-',
    expired_date TEXT DEFAULT '-',
    kondisi TEXT DEFAULT 'Baik',
    catatan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistik_kategori ON ckg_logistik_items(kategori);
CREATE INDEX IF NOT EXISTS idx_logistik_stok ON ckg_logistik_items(stok);

CREATE TABLE IF NOT EXISTS ckg_logistik_pemakaian (
    id TEXT PRIMARY KEY,
    tanggal TEXT NOT NULL,
    kegiatan TEXT DEFAULT 'CKG Sekolah',
    lokasi_kegiatan TEXT NOT NULL,
    petugas TEXT NOT NULL,
    items_json TEXT NOT NULL,
    items_detail_json TEXT,
    jumlah_sasaran INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Selesai',
    catatan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pemakaian_tanggal ON ckg_logistik_pemakaian(tanggal);
CREATE INDEX IF NOT EXISTS idx_pemakaian_petugas ON ckg_logistik_pemakaian(petugas);

CREATE TABLE IF NOT EXISTS ckg_logistik_peminjaman (
    id TEXT PRIMARY KEY,
    tanggal_pinjam TEXT NOT NULL,
    rencana_kembali TEXT,
    tanggal_kembali TEXT DEFAULT '-',
    peminjam TEXT NOT NULL,
    kegiatan TEXT DEFAULT 'CKG Sekolah',
    lokasi TEXT,
    kontak TEXT DEFAULT '-',
    daftar_alat_json TEXT NOT NULL,
    status TEXT DEFAULT 'Dipinjam',
    kondisi_kembali TEXT DEFAULT '-',
    catatan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_peminjaman_status ON ckg_logistik_peminjaman(status);
CREATE INDEX IF NOT EXISTS idx_peminjaman_peminjam ON ckg_logistik_peminjaman(peminjam);

-- --------------------------------------------------------------------
-- 10. MENU: REKAM OTOMASI & DATA ASIK ENCO (Bot Chrome Extension)
-- Tabel: enco_pasien (Rekam Identitas Pasien Terdaftar ASIK & Selesai Pelayanan)
-- Tabel: enco_logs (Riwayat Sesi Otomasi Bot ENCO)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enco_pasien (
    id TEXT PRIMARY KEY,
    nik TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    tanggal_lahir TEXT,
    jenis_kelamin TEXT,
    status_pernikahan TEXT DEFAULT '',
    pekerjaan TEXT DEFAULT '',
    provinsi TEXT DEFAULT 'Jawa Barat',
    kab_kota TEXT DEFAULT 'Kab. Bandung',
    kecamatan TEXT DEFAULT 'Banjaran',
    kelurahan TEXT DEFAULT '',
    alamat TEXT DEFAULT '',
    no_tiket TEXT,
    kategori TEXT DEFAULT 'Umum',
    status_pendaftaran TEXT DEFAULT 'Sudah Terdaftar',
    status_pelayanan TEXT DEFAULT 'Belum Pelayanan',
    tanggal_daftar TEXT,
    tanggal_pelayanan TEXT,
    petugas_enco TEXT DEFAULT 'Petugas',
    faskes TEXT DEFAULT 'Puskesmas Banjaran Kota',
    raw_details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enco_pasien_nik ON enco_pasien(nik);
CREATE INDEX IF NOT EXISTS idx_enco_pasien_tgl_daftar ON enco_pasien(tanggal_daftar);
CREATE INDEX IF NOT EXISTS idx_enco_pasien_tgl_layanan ON enco_pasien(tanggal_pelayanan);
CREATE INDEX IF NOT EXISTS idx_enco_pasien_petugas ON enco_pasien(petugas_enco);
CREATE INDEX IF NOT EXISTS idx_enco_pasien_status_reg ON enco_pasien(status_pendaftaran);
CREATE INDEX IF NOT EXISTS idx_enco_pasien_status_layanan ON enco_pasien(status_pelayanan);

CREATE TABLE IF NOT EXISTS enco_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petugas TEXT NOT NULL,
    jenis_kegiatan TEXT NOT NULL,
    total_pasien INTEGER DEFAULT 0,
    jumlah_berhasil INTEGER DEFAULT 0,
    jumlah_terdaftar INTEGER DEFAULT 0,
    jumlah_gagal INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Selesai',
    keterangan TEXT,
    r2_key TEXT DEFAULT '',
    session_id TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enco_logs_petugas ON enco_logs(petugas);
CREATE INDEX IF NOT EXISTS idx_enco_logs_created ON enco_logs(created_at);

a- --------------------------------------------------------------------
-- 10. MENU: CEK KESEHATAN GRATIS (STANDALONE DATASET FORMAT BOT ENCO)
-- Tabel: ckg_gratis_records
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ckg_gratis_records (
    id TEXT PRIMARY KEY,
    nik TEXT,
    nama_pasien TEXT,
    petugas_entry TEXT,
    tanggal_entry TEXT,
    lokasi_pelayanan TEXT DEFAULT 'Luar Gedung',
    status_entry TEXT DEFAULT 'Terverifikasi',
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ckg_gratis_nik ON ckg_gratis_records(nik);
CREATE INDEX IF NOT EXISTS idx_ckg_gratis_petugas ON ckg_gratis_records(petugas_entry);
CREATE INDEX IF NOT EXISTS idx_ckg_gratis_tanggal ON ckg_gratis_records(tanggal_entry);

-- --------------------------------------------------------------------
-- 11. ANTREAN OTOMASI BOT ENCO (CKG UMUM & CKG SEKOLAH)
-- Tabel: enco_bot_queue
-- --------------------------------------------------------------------
-- 13. TABEL ANTREAN BOT ENCO (CKG UMUM & CKG SEKOLAH)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enco_bot_queue (
    id TEXT PRIMARY KEY,
    jenis TEXT NOT NULL,
    record_id TEXT NOT NULL,
    nik TEXT NOT NULL,
    nama TEXT NOT NULL,
    data_json TEXT NOT NULL,
    status_pendaftaran TEXT DEFAULT 'antre',
    status_pelayanan TEXT DEFAULT 'antre',
    no_tiket TEXT DEFAULT '',
    keterangan TEXT DEFAULT '',
    petugas_antrean TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bot_queue_jenis ON enco_bot_queue(jenis);
CREATE INDEX IF NOT EXISTS idx_bot_queue_nik ON enco_bot_queue(nik);
CREATE INDEX IF NOT EXISTS idx_bot_queue_record_id ON enco_bot_queue(record_id);
CREATE INDEX IF NOT EXISTS idx_bot_queue_status_reg ON enco_bot_queue(status_pendaftaran);
CREATE INDEX IF NOT EXISTS idx_bot_queue_petugas ON enco_bot_queue(petugas_antrean);



