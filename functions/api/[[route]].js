// ============================================================================
// SICEKAS v2.0 - CLOUDFLARE PAGES FUNCTIONS (EDGE REST API GATEWAY)
// Database Engine: Cloudflare D1 (Serverless SQLite)
// ============================================================================

const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
};

const OFFICIAL_39_USERS = [
  [1, 'rina', '213117', '19740404 201411 2 001', 'NIP. 19740404 201411 2 001', 'dr. Rina Indriati', 'Kepala Puskesmas', 'III/d', 'Kepala Puskesmas', 'RI'],
  [2, 'teti', '213117', '19750816 200701 2 012', 'NIP. 19750816 200701 2 012', 'Teti Nuryati, S.Keb, Bdn', 'Satker/Bidan Mahir', 'III/b', 'PJ Klaster', 'TN'],
  [3, 'satrianita', '213117', '19730908 199403 2 006', 'NIP. 19730908 199403 2 006', 'Satrianita, SKM', 'Sanitarian Ahli Muda', 'IV/b', 'Admin', 'SN'],
  [4, 'asepyanto', '213117', '19690623 199103 1 002', 'NIP. 19690623 199103 1 002', 'Asep Yanto, AMKG', 'Perawat Gigi Penyelia', 'III/d', 'Petugas Puskesmas', 'AY'],
  [5, 'yayat', '213117', '19690613 198903 2 005', 'NIP. 19690613 198903 2 005', 'N. Yayat Rohayati, AM.Keb', 'Bidan Penyelia', 'III/d', 'Petugas Puskesmas', 'YR'],
  [6, 'tetimulyati', '213117', '19680825 199003 2 008', 'NIP. 19680825 199003 2 008', 'Rd Teti Mulyati, Amd.Kep', 'Perawat Penyelia', 'III/d', 'Petugas Puskesmas', 'TM'],
  [7, 'indri', '213117', '19681004 199103 2 007', 'NIP. 19681004 199103 2 007', 'Indri Yusiana, Amd.Kep', 'Perawat Penyelia', 'III/d', 'Petugas Puskesmas', 'IY'],
  [8, 'santi', '213117', '19781014 200501 2 007', 'NIP. 19781014 200501 2 007', 'Santi Sentri Yanti, S.Keb', 'Bidan Pelaksana', 'III/d', 'Petugas Puskesmas', 'SS'],
  [9, 'imas', '213117', '19690524 200604 2 004', 'NIP. 19690524 200604 2 004', 'Imas Winarti, AM.Keb', 'Bidan Pelaksana', 'III/a', 'Petugas Puskesmas', 'IW'],
  [10, 'eva', '213117', '19840508 201704 2 011', 'NIP. 19840508 201704 2 011', 'Eva Farida, S.Keb', 'Bidan Mahir', 'III/a', 'Petugas Puskesmas', 'EF'],
  [11, 'nengyulia', '213117', '19860725 201704 2 007', 'NIP. 19860725 201704 2 007', 'Neng Yulia Ernawati, S.Keb', 'Bidan Pelaksana', 'III/a', 'Petugas Puskesmas', 'NY'],
  [12, 'evasolina', '213117', '19821219 201704 2 003', 'NIP. 19821219 201704 2 003', 'Eva Solina, S.Keb', 'Bidan Pelaksana', 'III/a', 'Petugas Puskesmas', 'ES'],
  [13, 'riza', '213117', '19910127 202203 2 010', 'NIP. 19910127 202203 2 010', 'Riza Nur Multiani, A.Md.AK', 'Penata Laboratorium Kesehatan Terampil', 'II/c', 'Petugas Puskesmas', 'RN'],
  [14, 'drg_regina', '213117', '19930805 202505 2 002', 'NIP. 19930805 202505 2 002', 'drg. Regina Desi Gresiana Simamora', 'Dokter Gigi Ahli Pertama', 'III/b', 'Petugas Puskesmas', 'RG'],
  [15, 'nurul', '213117', '20001224 202505 2 002', 'NIP. 20001224 202505 2 002', 'Nurul Hidayah, Amd.Kes', 'Terapis Gigi dan Mulut Terampil', 'II/c', 'Petugas Puskesmas', 'NH'],
  [16, 'dadi', '213117', '19840525 202221 1 001', 'NIP. 19840525 202221 1 001', 'Dadi Permadi, SKM', 'Penyuluh Kesehatan Ahli Pertama', 'IX', 'PJ Klaster', 'DP'],
  [17, 'anisa', '213117', '19880321 202321 2 001', 'NIP. 19880321 202321 2 001', 'Anisa Rohmatunisa, AM.Keb', 'Bidan Terampil', 'VII', 'Petugas Puskesmas', 'AR'],
  [18, 'nina', '213117', '19960728 202321 2 005', 'NIP. 19960728 202321 2 005', 'Nina Mariyana, Amd.Kep', 'Perawat Terampil', 'VII', 'Petugas Puskesmas', 'NM'],
  [19, 'sheila', '213117', '19930713 202321 2 003', 'NIP. 19930713 202321 2 003', 'Sheila Nurlaila, A.Md.Gz', 'Nutrisionis Terampil', 'VII', 'Petugas Puskesmas', 'SN'],
  [20, 'debby', '213117', '19921004 202521 2 044', 'NIP. 19921004 202521 2 044', 'Debby Nadia Lofika, S.Farm. Apt', 'Apoteker', 'IX', 'Petugas Puskesmas', 'DL'],
  [21, 'lutfiyatun', '213117', '873.3204.10.02.005', 'NRP. 873.3204.10.02.005', 'Lutfiyatun Oktaviana, S.Kep.Ners', 'Perawat', 'PPTK PW', 'Petugas Puskesmas', 'LO'],
  [22, 'dr_dinar', '213117', '873.3204.07.05.005', 'NRP. 873.3204.07.05.005', 'dr. Dinar Dwi Restika Agustin', 'Dokter Umum', 'BLUD', 'Petugas Puskesmas', 'DD'],
  [23, 'dr_putri', '213117', '873.3204.08.06.029', 'NRP. 873.3204.08.06.029', 'dr. Putri Tasya Afifah', 'Dokter Umum', 'BLUD', 'Petugas Puskesmas', 'PT'],
  [24, 'drg_intan', '213117', '873.3204.08.06.019', 'NRP. 873.3204.08.06.019', 'drg. Intan Nur Atsila', 'Dokter Gigi', 'BLUD', 'Petugas Puskesmas', 'IN'],
  [25, 'rini', '213117', '873.06.02.021', 'NRP. 873.06.02.021', 'Rini Julianti, SE', 'Akuntan', 'BLUD', 'Petugas Puskesmas', 'RJ'],
  [26, 'andriana', '213117', '873.120.10.03', 'NRP. 873.120.10.03', 'Andriana Mahardhytia, Amd.Kes', 'Rekam Medis', 'BLUD', 'Petugas Puskesmas', 'AM'],
  [27, 'dilla', '213117', '873.3204.13.03.012', 'NRP. 873.3204.13.03.012', 'Dilla Anggraeni Pratiwi, A.Md.Akun', 'Admin BOK', 'BLUD', 'Admin', 'DA'],
  [28, 'ozie', '213117', '873.3204.16.02.008', 'NRP. 873.3204.16.02.008', 'Mochamad Fauzie, S.Gz', 'Nutrisionis', 'BLUD', 'Super Admin', 'MF'],
  [29, 'ilham', '213117', '873.3204.11.06.011', 'NRP. 873.3204.11.06.011', 'Ilham Ardiansyah Isnandar, SKM', 'Epidemiolog', 'BLUD', 'Petugas Puskesmas', 'IA'],
  [30, 'rian', '213117', '873.3204.12.06.007', 'NRP. 873.3204.12.06.007', 'Rian Sidik Sudiana, Amd.Kes', 'Rekam Medis', 'BLUD', 'Petugas Puskesmas', 'RS'],
  [31, 'fahri', '213117', '873.3204.13.07.037', 'NRP. 873.3204.13.07.037', 'Fahri Dzulfikar Rismayanto, A.Md. Bns', 'Admin BLUD', 'BLUD', 'Admin', 'FD'],
  [32, 'mutiara', '213117', '873.3204.05.05.005', 'NRP. 873.3204.05.05.005', 'Mutiara Sofiatussirri, Amd.', 'ATLM', 'BLUD', 'Petugas Puskesmas', 'MS'],
  [33, 'faridz', '213117', '873.3204.14.05.040', 'NRP. 873.3204.14.05.040', 'Muhamad Faridz Alparizy, Amd.Kep', 'Perawat', 'BLUD', 'Petugas Puskesmas', 'FA'],
  [34, 'nengsafitri', '213117', '873.3204.09.06.106', 'NRP. 873.3204.09.06.106', 'Neng Safitri Nur Ladyawati, AM.Keb', 'Bidan Desa', 'BLUD', 'Petugas Puskesmas', 'NS'],
  [35, 'dani', '213117', '873.3204.18.01.002', 'NRP. 873.3204.18.01.002', 'Dani Setiadi, S.Farm', 'TTK', 'BLUD', 'Petugas Puskesmas', 'DS'],
  [36, 'ripan', '213117', 'BLUD-SEC-01', 'NRP. BLUD-SEC-01', 'Ripan Sutiana', 'Petugas Keamanan', 'BLUD', 'Petugas Puskesmas', 'RS'],
  [37, 'mevi', '213117', 'BLUD-CL-01', 'NRP. BLUD-CL-01', 'Mevi Riyanayasti', 'Petugas Kebersihan', 'BLUD', 'Petugas Puskesmas', 'MR'],
  [38, 'adeboy', '213117', 'BLUD-DRV-01', 'NRP. BLUD-DRV-01', 'Ade Boy', 'Supir', 'BLUD', 'Petugas Puskesmas', 'AB'],
  [39, 'suhara', '213117', 'BLUD-SEC-02', 'NRP. BLUD-SEC-02', 'Suhara', 'Petugas Keamanan', 'BLUD', 'Petugas Puskesmas', 'SH']
];

async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const pathname = url.pathname;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Database Binding check
  const db = env.DB;
  if (!db) {
    return jsonResponse({
      success: false,
      error: 'Cloudflare D1 Database binding [DB] tidak ditemukan pada environment ini.',
      edge_engine: 'Cloudflare Pages Functions'
    }, 503);
  }

  try {
    // ------------------------------------------------------------------------
    // 1. HEALTH & DIAGNOSTICS ENDPOINT (/api/health)
    // ------------------------------------------------------------------------
    if (pathname === '/api/health' || pathname === '/api/ping') {
      const start = Date.now();
      const countRes = await db.prepare('SELECT COUNT(*) AS total FROM users').first();
      const latency = Date.now() - start;

      return jsonResponse({
        success: true,
        status: 'ONLINE',
        app: 'SICEKAS v2.0',
        platform: 'Cloudflare Pages & D1 Database',
        edge_colo: request.cf?.colo || 'CGK',
        edge_country: request.cf?.country || 'ID',
        d1_connected: true,
        total_registered_users: countRes?.total || 0,
        latency_ms: latency,
        timestamp: new Date().toISOString()
      });
    }

    // ------------------------------------------------------------------------
    // 2. AUTH LOGIN (/api/auth/login)
    // ------------------------------------------------------------------------
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await request.json();
      const { username, password } = body;

      if (!username || !password) {
        return jsonResponse({ success: false, error: 'Username dan kata sandi wajib diisi!' }, 400);
      }

      const user = await db.prepare(
        'SELECT * FROM users WHERE (username = ? OR nip = ?) AND is_active = 1'
      ).bind(username, username).first();

      if (!user || user.password_hash !== password) {
        return jsonResponse({ success: false, error: 'Username atau kata sandi tidak valid!' }, 401);
      }

      // Log successful login
      await db.prepare(
        'INSERT INTO audit_logs (user_nip, user_nama, category, action, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(user.nip, user.nama, 'AUTH', 'LOGIN_SUCCESS', `Login sukses akun ${user.nama} (${user.role})`, request.headers.get('CF-Connecting-IP') || '127.0.0.1').run();

      const { password_hash, ...userProfile } = user;
      return jsonResponse({
        success: true,
        message: `Selamat datang, ${user.nama}!`,
        user: userProfile
      });
    }

    // ------------------------------------------------------------------------
    // 3. USERS MANAGEMENT (/api/users, /api/seed-users, /api/users/update-role, /api/users/reset-pass)
    // ------------------------------------------------------------------------
    if (pathname === '/api/users' && method === 'GET') {
      let { results } = await db.prepare('SELECT id, no_urut, username, nip, nip_full, nama, jabatan, golongan, role, avatar, is_active, updated_at FROM users ORDER BY no_urut ASC').all();
      
      // Auto seed & purge dummy accounts if table is empty or contains legacy dummy users
      const hasDummy = results.some(u => ['cucu', 'wiwi', 'nuraini', 'anissa', 'deden', 'dr_fauzan'].includes(u.username));
      if (!results || results.length === 0 || hasDummy) {
        const validUsernames = OFFICIAL_39_USERS.map(u => `'${u[1]}'`).join(',');
        await db.prepare(`DELETE FROM users WHERE username NOT IN (${validUsernames})`).run();
        for (const u of OFFICIAL_39_USERS) {
          await db.prepare(`
            INSERT INTO users (no_urut, username, password_hash, nip, nip_full, nama, jabatan, golongan, role, avatar, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(username) DO UPDATE SET
              no_urut = excluded.no_urut,
              nip = excluded.nip,
              nip_full = excluded.nip_full,
              nama = excluded.nama,
              jabatan = excluded.jabatan,
              golongan = excluded.golongan,
              avatar = excluded.avatar
          `).bind(u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8], u[9]).run();
        }
        const refreshed = await db.prepare('SELECT id, no_urut, username, nip, nip_full, nama, jabatan, golongan, role, avatar, is_active, updated_at FROM users ORDER BY no_urut ASC').all();
        results = refreshed.results;
      }

      return jsonResponse({ success: true, total: results.length, users: results });
    }

    if ((pathname === '/api/seed-users' || pathname === '/api/users/sync') && (method === 'GET' || method === 'POST')) {
      const validUsernames = OFFICIAL_39_USERS.map(u => `'${u[1]}'`).join(',');
      await db.prepare(`DELETE FROM users WHERE username NOT IN (${validUsernames})`).run();
      for (const u of OFFICIAL_39_USERS) {
        await db.prepare(`
          INSERT INTO users (no_urut, username, password_hash, nip, nip_full, nama, jabatan, golongan, role, avatar, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          ON CONFLICT(username) DO UPDATE SET
            no_urut = excluded.no_urut,
            nip = excluded.nip,
            nip_full = excluded.nip_full,
            nama = excluded.nama,
            jabatan = excluded.jabatan,
            golongan = excluded.golongan,
            avatar = excluded.avatar
        `).bind(u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8], u[9]).run();
      }
      const { results } = await db.prepare('SELECT id, no_urut, username, nip, nip_full, nama, jabatan, golongan, role, avatar, is_active, updated_at FROM users ORDER BY no_urut ASC').all();
      return jsonResponse({
        success: true,
        message: '39 Akun Resmi Pegawai Puskesmas Banjaran Kota berhasil disinkronkan & akun dummy telah dihapus!',
        total: results.length,
        users: results
      });
    }

    if (pathname === '/api/users/update-role' && method === 'POST') {
      const body = await request.json();
      const { nip, role } = body;

      if (!nip || !role) {
        return jsonResponse({ success: false, error: 'NIP dan role wajib diisi!' }, 400);
      }

      await db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE nip = ?').bind(role, nip).run();

      await db.prepare(
        'INSERT INTO audit_logs (user_nip, user_nama, category, action, details) VALUES (?, ?, ?, ?, ?)'
      ).bind(nip, 'System', 'AUTH', 'UPDATE_ROLE', `Hak akses pegawai NIP ${nip} diubah menjadi ${role}`).run();

      return jsonResponse({ success: true, message: `Hak akses pegawai [${nip}] berhasil diubah menjadi: ${role}` });
    }

    if (pathname === '/api/users/reset-pass' && method === 'POST') {
      const body = await request.json();
      const { nip } = body;

      if (!nip) {
        return jsonResponse({ success: false, error: 'NIP pegawai wajib diisi!' }, 400);
      }

      await db.prepare('UPDATE users SET password_hash = "213117", updated_at = CURRENT_TIMESTAMP WHERE nip = ?').bind(nip).run();
      return jsonResponse({ success: true, message: `Kata sandi pegawai [${nip}] berhasil di-reset ke default.` });
    }

    if (pathname === '/api/users/change-password' && method === 'POST') {
      const body = await request.json();
      const { nip, username, oldPassword, newPassword } = body;

      if (!oldPassword || !newPassword) {
        return jsonResponse({ success: false, error: 'Password saat ini dan password baru wajib diisi!' }, 400);
      }

      if (newPassword.length < 6) {
        return jsonResponse({ success: false, error: 'Password baru minimal 6 karakter!' }, 400);
      }

      let user = null;
      if (nip) {
        user = await db.prepare('SELECT * FROM users WHERE nip = ?').bind(nip).first();
      } else if (username) {
        user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
      }

      if (!user) {
        return jsonResponse({ success: false, error: 'Akun pegawai tidak ditemukan di database!' }, 404);
      }

      if (user.password_hash !== oldPassword) {
        return jsonResponse({ success: false, error: 'Password saat ini yang Anda masukkan salah!' }, 401);
      }

      await db.prepare(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(newPassword, user.id).run();

      await db.prepare(
        'INSERT INTO audit_logs (user_nip, user_nama, category, action, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(user.nip, user.nama, 'AUTH', 'CHANGE_PASSWORD', `Password akun ${user.nama} berhasil diperbarui`, request.headers.get('CF-Connecting-IP') || '127.0.0.1').run();

      return jsonResponse({
        success: true,
        message: `Kata sandi akun [${user.nama}] berhasil diperbarui di Cloudflare D1 Database!`
      });
    }

    // ------------------------------------------------------------------------
    // 4. JADWAL KEGIATAN (/api/jadwal, /api/jadwal/save, /api/jadwal/delete)
    // ------------------------------------------------------------------------
    if (pathname === '/api/jadwal' && method === 'GET') {
      const bulan = url.searchParams.get('bulan');
      const tahun = url.searchParams.get('tahun');

      let query = 'SELECT * FROM jadwal_kegiatan';
      const params = [];

      if (bulan && tahun) {
        query += ' WHERE bulan = ? AND tahun = ?';
        params.push(parseInt(bulan), parseInt(tahun));
      }

      query += ' ORDER BY tanggal ASC';
      const stmt = db.prepare(query);
      const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

      const parsed = results.map(r => ({
        ...r,
        rekan_kolaborasi: typeof r.rekan_kolaborasi === 'string' ? JSON.parse(r.rekan_kolaborasi || '[]') : (r.rekan_kolaborasi || [])
      }));

      return jsonResponse({ success: true, total: parsed.length, data: parsed });
    }

    if (pathname === '/api/jadwal/save' && method === 'POST') {
      const item = await request.json();
      const id = item.id || `bok-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const dateObj = new Date(item.tanggal);
      const bulan = item.bulan || (dateObj.getMonth() + 1);
      const tahun = item.tahun || dateObj.getFullYear();
      const collabJson = typeof item.rekan_kolaborasi === 'string' ? item.rekan_kolaborasi : JSON.stringify(item.rekan_kolaborasi || []);

      await db.prepare(`
        INSERT INTO jadwal_kegiatan (id, tanggal, bulan, tahun, nama_kegiatan, keterangan, lokasi, petugas_nip, petugas_nama, petugas_jabatan, rekan_kolaborasi, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          tanggal = excluded.tanggal,
          bulan = excluded.bulan,
          tahun = excluded.tahun,
          nama_kegiatan = excluded.nama_kegiatan,
          keterangan = excluded.keterangan,
          lokasi = excluded.lokasi,
          petugas_nip = excluded.petugas_nip,
          petugas_nama = excluded.petugas_nama,
          petugas_jabatan = excluded.petugas_jabatan,
          rekan_kolaborasi = excluded.rekan_kolaborasi,
          status = excluded.status,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        id,
        item.tanggal,
        bulan,
        tahun,
        item.nama_kegiatan || item.kegiatan || '',
        item.keterangan || item.uraian || '',
        item.lokasi || '',
        item.petugas_nip || item.nip || '',
        item.petugas_nama || item.nama || '',
        item.petugas_jabatan || item.jabatan || '',
        collabJson,
        item.status || 'Disetujui'
      ).run();

      return jsonResponse({ success: true, message: 'Jadwal kegiatan berhasil disimpan ke Cloudflare D1!', id });
    }

    if (pathname === '/api/jadwal/delete' && (method === 'DELETE' || method === 'POST')) {
      const body = await request.json();
      const { id } = body;

      if (!id) {
        return jsonResponse({ success: false, error: 'ID jadwal kegiatan wajib disertakan!' }, 400);
      }

      await db.prepare('DELETE FROM jadwal_kegiatan WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: `Jadwal [${id}] berhasil dihapus dari Cloudflare D1.` });
    }

    // ------------------------------------------------------------------------
    // 5. POA BULANAN (/api/poa, /api/poa/save)
    // ------------------------------------------------------------------------
    if (pathname === '/api/poa' && method === 'GET') {
      const bulan = url.searchParams.get('bulan');
      const tahun = url.searchParams.get('tahun');
      const nip = url.searchParams.get('nip');

      let query = 'SELECT * FROM poa_bulanan WHERE 1=1';
      const params = [];

      if (bulan && tahun) {
        query += ' AND bulan = ? AND tahun = ?';
        params.push(parseInt(bulan), parseInt(tahun));
      }
      if (nip) {
        query += ' AND petugas_nip = ?';
        params.push(nip);
      }

      query += ' ORDER BY created_at DESC';
      const { results } = await db.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, total: results.length, data: results });
    }

    if (pathname === '/api/poa/save' && method === 'POST') {
      const item = await request.json();
      const id = item.id || `poa-${Date.now()}`;
      const bulan = parseInt(item.bulan) || (new Date().getMonth() + 1);
      const tahun = parseInt(item.tahun) || new Date().getFullYear();

      await db.prepare(`
        INSERT INTO poa_bulanan (id, bulan, tahun, petugas_nip, petugas_nama, program_kesehatan, uraian_kegiatan, target_sasaran, lokasi_pelaksanaan, vol_kegiatan, satuan, anggaran_bok, sumber_dana, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          bulan = excluded.bulan,
          tahun = excluded.tahun,
          program_kesehatan = excluded.program_kesehatan,
          uraian_kegiatan = excluded.uraian_kegiatan,
          target_sasaran = excluded.target_sasaran,
          lokasi_pelaksanaan = excluded.lokasi_pelaksanaan,
          vol_kegiatan = excluded.vol_kegiatan,
          satuan = excluded.satuan,
          anggaran_bok = excluded.anggaran_bok,
          sumber_dana = excluded.sumber_dana,
          status = excluded.status,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        id,
        bulan,
        tahun,
        item.petugas_nip || item.nip || '',
        item.petugas_nama || item.nama || '',
        item.program_kesehatan || item.program || '',
        item.uraian_kegiatan || item.uraian || '',
        item.target_sasaran || '',
        item.lokasi_pelaksanaan || '',
        parseInt(item.vol_kegiatan) || 1,
        item.satuan || 'Kegiatan',
        parseFloat(item.anggaran_bok) || 0,
        item.sumber_dana || 'BOK Puskesmas',
        item.status || 'Aktif'
      ).run();

      return jsonResponse({ success: true, message: 'POA Bulanan berhasil disimpan ke Cloudflare D1!', id });
    }

    // ------------------------------------------------------------------------
    // 6. TP POL JASPEL (/api/tppol, /api/tppol/save)
    // ------------------------------------------------------------------------
    if (pathname === '/api/tppol' && method === 'GET') {
      const bulan = url.searchParams.get('bulan');
      const tahun = url.searchParams.get('tahun');
      const nip = url.searchParams.get('nip');

      let query = 'SELECT * FROM tppol_jaspel WHERE 1=1';
      const params = [];

      if (bulan && tahun) {
        query += ' AND bulan = ? AND tahun = ?';
        params.push(parseInt(bulan), parseInt(tahun));
      }
      if (nip) {
        query += ' AND petugas_nip = ?';
        params.push(nip);
      }

      query += ' ORDER BY created_at DESC';
      const { results } = await db.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, total: results.length, data: results });
    }

    if (pathname === '/api/tppol/save' && method === 'POST') {
      const item = await request.json();
      const id = item.id || `tppol-${item.petugas_nip || 'user'}-${item.bulan || '0'}-${item.tahun || '2026'}`;
      const bulan = parseInt(item.bulan) || (new Date().getMonth() + 1);
      const tahun = parseInt(item.tahun) || new Date().getFullYear();

      await db.prepare(`
        INSERT INTO tppol_jaspel (id, bulan, tahun, petugas_nip, petugas_nama, petugas_jabatan, skor_kehadiran, skor_pelayanan, skor_administrasi, skor_perilaku, total_skor, catatan, status_verifikasi, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          bulan = excluded.bulan,
          tahun = excluded.tahun,
          skor_kehadiran = excluded.skor_kehadiran,
          skor_pelayanan = excluded.skor_pelayanan,
          skor_administrasi = excluded.skor_administrasi,
          skor_perilaku = excluded.skor_perilaku,
          total_skor = excluded.total_skor,
          catatan = excluded.catatan,
          status_verifikasi = excluded.status_verifikasi,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        id,
        bulan,
        tahun,
        item.petugas_nip || item.nip || '',
        item.petugas_nama || item.nama || '',
        item.petugas_jabatan || item.jabatan || '',
        parseFloat(item.skor_kehadiran) || 100.0,
        parseFloat(item.skor_pelayanan) || 95.0,
        parseFloat(item.skor_administrasi) || 90.0,
        parseFloat(item.skor_perilaku) || 95.0,
        parseFloat(item.total_skor) || 95.0,
        item.catatan || '',
        item.status_verifikasi || 'Terverifikasi'
      ).run();

      return jsonResponse({ success: true, message: 'Scoring TP POL berhasil disimpan ke Cloudflare D1!', id });
    }

    // ------------------------------------------------------------------------
    // 7. SPPD & LPT (/api/sppd, /api/sppd/save)
    // ------------------------------------------------------------------------
    if (pathname === '/api/sppd' && method === 'GET') {
      const id = url.searchParams.get('id');
      const nip = url.searchParams.get('nip');

      let query = 'SELECT * FROM sppd_lpt WHERE 1=1';
      const params = [];
      if (id) { query += ' AND id = ?'; params.push(id); }
      if (nip) { query += ' AND petugas_nip = ?'; params.push(nip); }

      query += ' ORDER BY created_at DESC';
      const { results } = await db.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, total: results.length, data: results });
    }

    if (pathname === '/api/sppd/save' && method === 'POST') {
      const item = await request.json();
      const id = item.id || `sppd-${Date.now()}`;
      const fotoJson = typeof item.foto_dokumentasi === 'string' ? item.foto_dokumentasi : JSON.stringify(item.foto_dokumentasi || []);

      await db.prepare(`
        INSERT INTO sppd_lpt (id, no_surat, tanggal_surat, petugas_nip, petugas_nama, maksud_perjalanan, tempat_tujuan, tanggal_berangkat, tanggal_kembali, lama_hari, alat_angkut, hasil_kegiatan, kendala_masalah, saran_tindak_lanjut, foto_dokumentasi, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          no_surat = excluded.no_surat,
          tanggal_surat = excluded.tanggal_surat,
          maksud_perjalanan = excluded.maksud_perjalanan,
          tempat_tujuan = excluded.tempat_tujuan,
          tanggal_berangkat = excluded.tanggal_berangkat,
          tanggal_kembali = excluded.tanggal_kembali,
          lama_hari = excluded.lama_hari,
          alat_angkut = excluded.alat_angkut,
          hasil_kegiatan = excluded.hasil_kegiatan,
          kendala_masalah = excluded.kendala_masalah,
          saran_tindak_lanjut = excluded.saran_tindak_lanjut,
          foto_dokumentasi = excluded.foto_dokumentasi,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        id,
        item.no_surat || '090/001/PKM-BK/2026',
        item.tanggal_surat || new Date().toISOString().slice(0, 10),
        item.petugas_nip || '',
        item.petugas_nama || '',
        item.maksud_perjalanan || '',
        item.tempat_tujuan || '',
        item.tanggal_berangkat || new Date().toISOString().slice(0, 10),
        item.tanggal_kembali || new Date().toISOString().slice(0, 10),
        parseInt(item.lama_hari) || 1,
        item.alat_angkut || 'Kendaraan Pribadi',
        item.hasil_kegiatan || '',
        item.kendala_masalah || '',
        item.saran_tindak_lanjut || '',
        fotoJson
      ).run();

      return jsonResponse({ success: true, message: 'SPPD & LPT berhasil disimpan ke Cloudflare D1!', id });
    }

    // ------------------------------------------------------------------------
    // 8. SUPER ADMIN SQL RUNNER CONSOLE (/api/sql)
    // ------------------------------------------------------------------------
    if (pathname === '/api/sql' && method === 'POST') {
      const body = await request.json();
      const { sql, secret_key } = body;

      if (!sql) {
        return jsonResponse({ success: false, error: 'Query SQL wajib disertakan!' }, 400);
      }

      const isSelect = sql.trim().toLowerCase().startsWith('select');
      const stmt = db.prepare(sql);

      if (isSelect) {
        const { results } = await stmt.all();
        return jsonResponse({ success: true, type: 'SELECT', row_count: results.length, rows: results });
      } else {
        const info = await stmt.run();
        return jsonResponse({ success: true, type: 'MUTATE', info });
      }
    }

    // ------------------------------------------------------------------------
    // 9. DATABASE BACKUP EXPORT (/api/export-db)
    // ------------------------------------------------------------------------
    if (pathname === '/api/export-db' && method === 'GET') {
      const [users, jadwal, poa, tppol, sppd] = await Promise.all([
        db.prepare('SELECT * FROM users').all(),
        db.prepare('SELECT * FROM jadwal_kegiatan').all(),
        db.prepare('SELECT * FROM poa_bulanan').all(),
        db.prepare('SELECT * FROM tppol_jaspel').all(),
        db.prepare('SELECT * FROM sppd_lpt').all()
      ]);

      return jsonResponse({
        success: true,
        app: 'SICEKAS v2.0',
        database_engine: 'Cloudflare D1',
        exported_at: new Date().toISOString(),
        tables: {
          users: users.results,
          jadwal_kegiatan: jadwal.results,
          poa_bulanan: poa.results,
          tppol_jaspel: tppol.results,
          sppd_lpt: sppd.results
        }
      });
    }

    // 404 Route Not Found
    return jsonResponse({ success: false, error: `Endpoint API tidak ditemukan: ${method} ${pathname}` }, 404);

  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message || 'Internal Server Error pada Cloudflare & D1 Database'
    }, 500);
  }
}

// 1. Support Cloudflare Pages Functions
export async function onRequest(context) {
  return handleApiRequest(context.request, context.env, context);
}

// 2. Support Cloudflare Workers (Format ES Module - Wajib untuk D1 Database Binding)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. API Routes Handler
    if (url.pathname.startsWith('/api')) {
      return handleApiRequest(request, env, ctx);
    }

    // 2. Static Assets Handler (Cloudflare Workers Static Assets)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      let pathname = url.pathname;
      if (pathname === '/' || pathname === '' || pathname === '/login') {
        pathname = '/index.html';
      } else if (pathname === '/dashboard') {
        pathname = '/dashboard.html';
      }

      // Fetch the mapped static asset
      const assetUrl = new URL(pathname, url.origin);
      const assetRequest = new Request(assetUrl.toString(), request);
      const response = await env.ASSETS.fetch(assetRequest);

      if (response.status !== 404) {
        return response;
      }

      // Fallback to original request
      const origRes = await env.ASSETS.fetch(request);
      if (origRes.status !== 404) {
        return origRes;
      }

      // Default fallback for SPA
      return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
    }

    return handleApiRequest(request, env, ctx);
  }
};
