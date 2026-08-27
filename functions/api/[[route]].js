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
  [1, 'rina', 'bankot2026', '19740404 201411 2 001', 'NIP. 19740404 201411 2 001', 'dr. Rina Indriati', 'Kepala Puskesmas', 'III/d', 'Kepala Puskesmas', 'RI'],
  [2, 'teti', 'bankot2026', '19750816 200701 2 012', 'NIP. 19750816 200701 2 012', 'Teti Nuryati, S.Keb, Bdn', 'Satker/Bidan Mahir', 'III/b', 'PJ Klaster', 'TN'],
  [3, 'satrianita', 'bankot2026', '19730908 199403 2 006', 'NIP. 19730908 199403 2 006', 'Satrianita, SKM', 'Sanitarian Ahli Muda', 'IV/b', 'Admin', 'SN'],
  [4, 'asepyanto', 'bankot2026', '19690623 199103 1 002', 'NIP. 19690623 199103 1 002', 'Asep Yanto, AMKG', 'Perawat Gigi Penyelia', 'III/d', 'Petugas Puskesmas', 'AY'],
  [5, 'yayat', 'bankot2026', '19690613 198903 2 005', 'NIP. 19690613 198903 2 005', 'N. Yayat Rohayati, AM.Keb', 'Bidan Penyelia', 'III/d', 'Petugas Puskesmas', 'YR'],
  [6, 'tetimulyati', 'bankot2026', '19680825 199003 2 008', 'NIP. 19680825 199003 2 008', 'Rd Teti Mulyati, Amd.Kep', 'Perawat Penyelia', 'III/d', 'Petugas Puskesmas', 'TM'],
  [7, 'indri', 'bankot2026', '19681004 199103 2 007', 'NIP. 19681004 199103 2 007', 'Indri Yusiana, Amd.Kep', 'Perawat Penyelia', 'III/d', 'Petugas Puskesmas', 'IY'],
  [8, 'santi', 'bankot2026', '19781014 200501 2 007', 'NIP. 19781014 200501 2 007', 'Santi Sentri Yanti, S.Keb', 'Bidan Pelaksana', 'III/d', 'Petugas Puskesmas', 'SS'],
  [9, 'imas', 'bankot2026', '19690524 200604 2 004', 'NIP. 19690524 200604 2 004', 'Imas Winarti, AM.Keb', 'Bidan Pelaksana', 'III/a', 'Petugas Puskesmas', 'IW'],
  [10, 'eva', 'bankot2026', '19840508 201704 2 011', 'NIP. 19840508 201704 2 011', 'Eva Farida, S.Keb', 'Bidan Mahir', 'III/a', 'Petugas Puskesmas', 'EF'],
  [11, 'nengyulia', 'bankot2026', '19860725 201704 2 007', 'NIP. 19860725 201704 2 007', 'Neng Yulia Ernawati, S.Keb', 'Bidan Pelaksana', 'III/a', 'Petugas Puskesmas', 'NY'],
  [12, 'evasolina', 'bankot2026', '19821219 201704 2 003', 'NIP. 19821219 201704 2 003', 'Eva Solina, S.Keb', 'Bidan Pelaksana', 'III/a', 'Petugas Puskesmas', 'ES'],
  [13, 'riza', 'bankot2026', '19910127 202203 2 010', 'NIP. 19910127 202203 2 010', 'Riza Nur Multiani, A.Md.AK', 'Penata Laboratorium Kesehatan Terampil', 'II/c', 'Petugas Puskesmas', 'RN'],
  [14, 'drg_regina', 'bankot2026', '19930805 202505 2 002', 'NIP. 19930805 202505 2 002', 'drg. Regina Desi Gresiana Simamora', 'Dokter Gigi Ahli Pertama', 'III/b', 'Petugas Puskesmas', 'RG'],
  [15, 'nurul', 'bankot2026', '20001224 202505 2 002', 'NIP. 20001224 202505 2 002', 'Nurul Hidayah, Amd.Kes', 'Terapis Gigi dan Mulut Terampil', 'II/c', 'Petugas Puskesmas', 'NH'],
  [16, 'dadi', 'bankot2026', '19840525 202221 1 001', 'NIP. 19840525 202221 1 001', 'Dadi Permadi, SKM', 'Penyuluh Kesehatan Ahli Pertama', 'IX', 'PJ Klaster', 'DP'],
  [17, 'anisa', 'bankot2026', '19880321 202321 2 001', 'NIP. 19880321 202321 2 001', 'Anisa Rohmatunisa, AM.Keb', 'Bidan Terampil', 'VII', 'Petugas Puskesmas', 'AR'],
  [18, 'nina', 'bankot2026', '19960728 202321 2 005', 'NIP. 19960728 202321 2 005', 'Nina Mariyana, Amd.Kep', 'Perawat Terampil', 'VII', 'Petugas Puskesmas', 'NM'],
  [19, 'sheila', 'bankot2026', '19930713 202321 2 003', 'NIP. 19930713 202321 2 003', 'Sheila Nurlaila, A.Md.Gz', 'Nutrisionis Terampil', 'VII', 'Petugas Puskesmas', 'SN'],
  [20, 'debby', 'bankot2026', '19921004 202521 2 044', 'NIP. 19921004 202521 2 044', 'Debby Nadia Lofika, S.Farm. Apt', 'Apoteker', 'IX', 'Petugas Puskesmas', 'DL'],
  [21, 'lutfiyatun', 'bankot2026', '873.3204.10.02.005', 'NRP. 873.3204.10.02.005', 'Lutfiyatun Oktaviana, S.Kep.Ners', 'Perawat', 'PPTK PW', 'Petugas Puskesmas', 'LO'],
  [22, 'dr_dinar', 'bankot2026', '873.3204.07.05.005', 'NRP. 873.3204.07.05.005', 'dr. Dinar Dwi Restika Agustin', 'Dokter Umum', 'BLUD', 'Petugas Puskesmas', 'DD'],
  [23, 'dr_putri', 'bankot2026', '873.3204.08.06.029', 'NRP. 873.3204.08.06.029', 'dr. Putri Tasya Afifah', 'Dokter Umum', 'BLUD', 'Petugas Puskesmas', 'PT'],
  [24, 'drg_intan', 'bankot2026', '873.3204.08.06.019', 'NRP. 873.3204.08.06.019', 'drg. Intan Nur Atsila', 'Dokter Gigi', 'BLUD', 'Petugas Puskesmas', 'IN'],
  [25, 'rini', 'bankot2026', '873.06.02.021', 'NRP. 873.06.02.021', 'Rini Julianti, SE', 'Akuntan', 'BLUD', 'Petugas Puskesmas', 'RJ'],
  [26, 'andriana', 'bankot2026', '873.120.10.03', 'NRP. 873.120.10.03', 'Andriana Mahardhytia, Amd.Kes', 'Rekam Medis', 'BLUD', 'Petugas Puskesmas', 'AM'],
  [27, 'dilla', 'bankot2026', '873.3204.13.03.012', 'NRP. 873.3204.13.03.012', 'Dilla Anggraeni Pratiwi, A.Md.Akun', 'Admin BOK', 'BLUD', 'Admin', 'DA'],
  [28, 'ozie', 'bankot2026', '873.3204.16.02.008', 'NRP. 873.3204.16.02.008', 'Mochamad Fauzie, S.Gz', 'Nutrisionis', 'BLUD', 'Super Admin', 'MF'],
  [29, 'ilham', 'bankot2026', '873.3204.11.06.011', 'NRP. 873.3204.11.06.011', 'Ilham Ardiansyah Isnandar, SKM', 'Epidemiolog', 'BLUD', 'Petugas Puskesmas', 'IA'],
  [30, 'rian', 'bankot2026', '873.3204.12.06.007', 'NRP. 873.3204.12.06.007', 'Rian Sidik Sudiana, Amd.Kes', 'Rekam Medis', 'BLUD', 'Petugas Puskesmas', 'RS'],
  [31, 'fahri', 'bankot2026', '873.3204.13.07.037', 'NRP. 873.3204.13.07.037', 'Fahri Dzulfikar Rismayanto, A.Md. Bns', 'Admin BLUD', 'BLUD', 'Admin', 'FD'],
  [32, 'mutiara', 'bankot2026', '873.3204.05.05.005', 'NRP. 873.3204.05.05.005', 'Mutiara Sofiatussirri, Amd.', 'ATLM', 'BLUD', 'Petugas Puskesmas', 'MS'],
  [33, 'faridz', 'bankot2026', '873.3204.14.05.040', 'NRP. 873.3204.14.05.040', 'Muhamad Faridz Alparizy, Amd.Kep', 'Perawat', 'BLUD', 'Petugas Puskesmas', 'FA'],
  [34, 'nengsafitri', 'bankot2026', '873.3204.09.06.106', 'NRP. 873.3204.09.06.106', 'Neng Safitri Nur Ladyawati, AM.Keb', 'Bidan Desa', 'BLUD', 'Petugas Puskesmas', 'NS'],
  [35, 'dani', 'bankot2026', '873.3204.18.01.002', 'NRP. 873.3204.18.01.002', 'Dani Setiadi, S.Farm', 'TTK', 'BLUD', 'Petugas Puskesmas', 'DS'],
  [36, 'ripan', 'bankot2026', 'BLUD-SEC-01', 'NRP. BLUD-SEC-01', 'Ripan Sutiana', 'Petugas Keamanan', 'BLUD', 'Petugas Puskesmas', 'RS'],
  [37, 'mevi', 'bankot2026', 'BLUD-CL-01', 'NRP. BLUD-CL-01', 'Mevi Riyanayasti', 'Petugas Kebersihan', 'BLUD', 'Petugas Puskesmas', 'MR'],
  [38, 'adeboy', 'bankot2026', 'BLUD-DRV-01', 'NRP. BLUD-DRV-01', 'Ade Boy', 'Supir', 'BLUD', 'Petugas Puskesmas', 'AB'],
  [39, 'suhara', 'bankot2026', 'BLUD-SEC-02', 'NRP. BLUD-SEC-02', 'Suhara', 'Petugas Keamanan', 'BLUD', 'Petugas Puskesmas', 'SH']
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
    // ------------------------------------------------------------------------
    // 3. USERS MANAGEMENT (/api/users, /api/users/save, /api/users/update-role, /api/users/update-status, /api/users/delete, /api/users/reset-pass)
    // ------------------------------------------------------------------------
    if (pathname === '/api/users' && method === 'GET') {
      let { results } = await db.prepare('SELECT id, no_urut, username, nip, nip_full, nama, jabatan, golongan, role, avatar, is_active, updated_at FROM users ORDER BY no_urut ASC, id ASC').all();
      
      // Auto seed official accounts if table is completely empty
      if (!results || results.length === 0) {
        for (const u of OFFICIAL_39_USERS) {
          await db.prepare(`
            INSERT INTO users (no_urut, username, password_hash, nip, nip_full, nama, jabatan, golongan, role, avatar, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(username) DO NOTHING
          `).bind(u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8], u[9]).run();
        }
        const refreshed = await db.prepare('SELECT id, no_urut, username, nip, nip_full, nama, jabatan, golongan, role, avatar, is_active, updated_at FROM users ORDER BY no_urut ASC, id ASC').all();
        results = refreshed.results;
      }

      return jsonResponse({ success: true, total: results.length, users: results });
    }

    if (pathname === '/api/users/save' && method === 'POST') {
      const body = await request.json();
      const { id, nama, nip, nip_full, username, jabatan, golongan, role, is_active, password } = body;

      if (!nama || !nip || !username) {
        return jsonResponse({ success: false, error: 'Nama Lengkap, NIP/NRP, dan Username wajib diisi!' }, 400);
      }

      const cleanUsername = String(username).toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
      const cleanNip = String(nip).trim();
      const fullNip = nip_full || (cleanNip.startsWith('19') ? `NIP. ${cleanNip}` : `NRP. ${cleanNip}`);
      const userRole = role || 'Petugas Puskesmas';
      const userGol = golongan || 'BLUD';
      const userActive = (is_active === 0 || is_active === false || is_active === '0') ? 0 : 1;
      const avatarLetters = (nama || 'MF').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

      if (id) {
        // Update existing user
        if (password && password.trim().length >= 6) {
          await db.prepare(`
            UPDATE users SET
              nama = ?, nip = ?, nip_full = ?, username = ?, jabatan = ?,
              golongan = ?, role = ?, is_active = ?, avatar = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? OR nip = ?
          `).bind(nama, cleanNip, fullNip, cleanUsername, jabatan, userGol, userRole, userActive, avatarLetters, password.trim(), id, cleanNip).run();
        } else {
          await db.prepare(`
            UPDATE users SET
              nama = ?, nip = ?, nip_full = ?, username = ?, jabatan = ?,
              golongan = ?, role = ?, is_active = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? OR nip = ?
          `).bind(nama, cleanNip, fullNip, cleanUsername, jabatan, userGol, userRole, userActive, avatarLetters, id, cleanNip).run();
        }

        await db.prepare(
          'INSERT INTO audit_logs (user_nip, user_nama, category, action, details) VALUES (?, ?, ?, ?, ?)'
        ).bind(cleanNip, nama, 'USER_MGT', 'UPDATE_USER', `Data pegawai [${nama}] (${cleanNip}) diperbarui`).run();

        return jsonResponse({ success: true, message: `Data pegawai [${nama}] berhasil diperbarui di Cloudflare D1!` });
      } else {
        // Insert new user
        const maxNo = await db.prepare('SELECT MAX(no_urut) as max_no FROM users').first();
        const nextNo = (maxNo?.max_no || 39) + 1;
        const passHash = (password && password.trim()) ? password.trim() : 'bankot2026';

        await db.prepare(`
          INSERT INTO users (no_urut, username, password_hash, nip, nip_full, nama, jabatan, golongan, role, avatar, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(nextNo, cleanUsername, passHash, cleanNip, fullNip, nama, jabatan, userGol, userRole, avatarLetters, userActive).run();

        await db.prepare(
          'INSERT INTO audit_logs (user_nip, user_nama, category, action, details) VALUES (?, ?, ?, ?, ?)'
        ).bind(cleanNip, nama, 'USER_MGT', 'CREATE_USER', `Akun pegawai baru [${nama}] (${cleanUsername}) didaftarkan`).run();

        return jsonResponse({ success: true, message: `Akun pegawai baru [${nama}] berhasil didaftarkan ke Cloudflare D1!` });
      }
    }

    if (pathname === '/api/users/update-role' && method === 'POST') {
      const body = await request.json();
      const { nip, id, role } = body;

      if ((!nip && !id) || !role) {
        return jsonResponse({ success: false, error: 'NIP/ID dan role wajib diisi!' }, 400);
      }

      if (id) {
        await db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(role, id).run();
      } else {
        await db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE nip = ?').bind(role, nip).run();
      }

      await db.prepare(
        'INSERT INTO audit_logs (user_nip, user_nama, category, action, details) VALUES (?, ?, ?, ?, ?)'
      ).bind(nip || String(id), 'System', 'AUTH', 'UPDATE_ROLE', `Hak akses pegawai [${nip || id}] diubah menjadi ${role}`).run();

      return jsonResponse({ success: true, message: `Hak akses pegawai [${nip || id}] berhasil diubah menjadi: ${role}` });
    }

    if (pathname === '/api/users/update-status' && method === 'POST') {
      const body = await request.json();
      const { nip, id, is_active } = body;

      const activeVal = (is_active === 1 || is_active === true || is_active === '1') ? 1 : 0;

      if (id) {
        await db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(activeVal, id).run();
      } else {
        await db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE nip = ?').bind(activeVal, nip).run();
      }

      const statusText = activeVal === 1 ? 'Aktif' : 'Nonaktif';
      await db.prepare(
        'INSERT INTO audit_logs (user_nip, user_nama, category, action, details) VALUES (?, ?, ?, ?, ?)'
      ).bind(nip || String(id), 'System', 'AUTH', 'UPDATE_STATUS', `Status akun pegawai [${nip || id}] diubah menjadi ${statusText}`).run();

      return jsonResponse({ success: true, message: `Status akun pegawai [${nip || id}] berhasil diubah menjadi: ${statusText}` });
    }

    if (pathname === '/api/users/delete' && (method === 'POST' || method === 'DELETE')) {
      const body = await request.json();
      const { nip, id, username } = body;

      if (!nip && !id && !username) {
        return jsonResponse({ success: false, error: 'Identitas pegawai (NIP/ID/Username) wajib disertakan!' }, 400);
      }

      if (username === 'ozie' || nip === '873.3204.16.02.008') {
        return jsonResponse({ success: false, error: 'Akun Super Admin Utama dilindungi dan tidak dapat dihapus!' }, 403);
      }

      if (id) {
        await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
      } else if (nip) {
        await db.prepare('DELETE FROM users WHERE nip = ?').bind(nip).run();
      } else if (username) {
        await db.prepare('DELETE FROM users WHERE username = ?').bind(username).run();
      }

      await db.prepare(
        'INSERT INTO audit_logs (user_nip, user_nama, category, action, details) VALUES (?, ?, ?, ?, ?)'
      ).bind(nip || username || String(id), 'System', 'USER_MGT', 'DELETE_USER', `Akun pegawai [${nip || username || id}] dihapus dari sistem`).run();

      return jsonResponse({ success: true, message: 'Akun pegawai berhasil dihapus dari Cloudflare D1 Database.' });
    }

    if (pathname === '/api/seed-users' || pathname === '/api/users/sync') {
      const validUsernames = OFFICIAL_39_USERS.map(u => `'${u[1]}'`).join(',');
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
      const { results } = await db.prepare('SELECT id, no_urut, username, nip, nip_full, nama, jabatan, golongan, role, avatar, is_active, updated_at FROM users ORDER BY no_urut ASC, id ASC').all();
      return jsonResponse({
        success: true,
        message: '39 Akun Resmi Pegawai Puskesmas Banjaran Kota berhasil disinkronkan!',
        total: results.length,
        users: results
      });
    }

    if (pathname === '/api/users/reset-pass' && method === 'POST') {
      const body = await request.json();
      const { nip, id } = body;

      if (!nip && !id) {
        return jsonResponse({ success: false, error: 'NIP atau ID pegawai wajib diisi!' }, 400);
      }

      if (id) {
        await db.prepare('UPDATE users SET password_hash = "bankot2026", updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
      } else {
        await db.prepare('UPDATE users SET password_hash = "bankot2026", updated_at = CURRENT_TIMESTAMP WHERE nip = ?').bind(nip).run();
      }

      return jsonResponse({ success: true, message: `Kata sandi pegawai [${nip || id}] berhasil di-reset ke default (bankot2026).` });
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

      // Auto-migration: Ensure table exists
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS jadwal_kegiatan (
            id TEXT PRIMARY KEY,
            tanggal DATE NOT NULL,
            bulan INTEGER NOT NULL,
            tahun INTEGER NOT NULL,
            nama_kegiatan TEXT NOT NULL,
            keterangan TEXT,
            lokasi TEXT,
            petugas_nip TEXT NOT NULL,
            petugas_nama TEXT NOT NULL,
            petugas_jabatan TEXT,
            rekan_kolaborasi TEXT,
            status TEXT NOT NULL DEFAULT 'Disetujui',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run();
      } catch (tblErr) {}

      let query = 'SELECT * FROM jadwal_kegiatan WHERE (id NOT LIKE "poa-%")';
      const params = [];

      if (bulan && tahun) {
        const mNum = parseInt(bulan, 10);
        const yNum = parseInt(tahun, 10);
        const mStr = String(mNum).padStart(2, '0');
        // Match either by bulan & tahun columns, or by ISO date prefix (YYYY-MM-%) to prevent timezone mismatch data loss
        query += ' AND ((bulan = ? AND tahun = ?) OR (tanggal LIKE ?))';
        params.push(mNum, yNum, `${yNum}-${mStr}-%`);
      }

      query += ' ORDER BY tanggal ASC';
      const stmt = db.prepare(query);
      const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

      const parsed = (results || []).map(r => {
        let b = r.bulan;
        let y = r.tahun;
        if (r.tanggal && typeof r.tanggal === 'string' && r.tanggal.includes('-')) {
          const p = r.tanggal.split('-');
          y = parseInt(p[0], 10) || y;
          b = parseInt(p[1], 10) || b;
        }
        return {
          ...r,
          bulan: b,
          tahun: y,
          rekan_kolaborasi: typeof r.rekan_kolaborasi === 'string' ? JSON.parse(r.rekan_kolaborasi || '[]') : (r.rekan_kolaborasi || [])
        };
      });

      return jsonResponse({ success: true, total: parsed.length, data: parsed });
    }

    if (pathname === '/api/jadwal/save' && method === 'POST') {
      const item = await request.json();
      
      let tanggal = item.tanggal || '';
      if (tanggal && typeof tanggal === 'string' && tanggal.includes('-')) {
        const parts = tanggal.split('-');
        if (parts.length === 3) {
          const y = parts[0];
          const m = String(parseInt(parts[1], 10)).padStart(2, '0');
          const d = String(parseInt(parts[2], 10)).padStart(2, '0');
          tanggal = `${y}-${m}-${d}`;
        }
      }

      const id = item.id || `bok-${tanggal || Date.now()}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      // Calculate bulan and tahun directly from tanggal string "YYYY-MM-DD" to avoid timezone conversion bugs
      let bulan = parseInt(item.bulan, 10);
      let tahun = parseInt(item.tahun, 10);
      if (isNaN(bulan) || isNaN(tahun)) {
        if (tanggal && tanggal.includes('-')) {
          const parts = tanggal.split('-');
          tahun = isNaN(tahun) ? parseInt(parts[0], 10) : tahun;
          bulan = isNaN(bulan) ? parseInt(parts[1], 10) : bulan;
        } else {
          const now = new Date();
          bulan = now.getMonth() + 1;
          tahun = now.getFullYear();
        }
      }

      const collabJson = typeof item.rekan_kolaborasi === 'string' ? item.rekan_kolaborasi : JSON.stringify(item.rekan_kolaborasi || []);

      // Auto-migration: Ensure table exists
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS jadwal_kegiatan (
            id TEXT PRIMARY KEY,
            tanggal DATE NOT NULL,
            bulan INTEGER NOT NULL,
            tahun INTEGER NOT NULL,
            nama_kegiatan TEXT NOT NULL,
            keterangan TEXT,
            lokasi TEXT,
            petugas_nip TEXT NOT NULL,
            petugas_nama TEXT NOT NULL,
            petugas_jabatan TEXT,
            rekan_kolaborasi TEXT,
            status TEXT NOT NULL DEFAULT 'Disetujui',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run();
      } catch (tblErr) {}

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
        tanggal,
        bulan,
        tahun,
        item.nama_kegiatan || item.kegiatan || item.namaKegiatan || '',
        item.keterangan || item.uraian || '',
        item.lokasi || '',
        item.petugas_nip || item.nip || '',
        item.petugas_nama || item.nama || item.namaUser || '',
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
    // 5. POA BULANAN (/api/poa, /api/poa/save, /api/poa/delete) - SEPARATE TABLE poa_bulanan
    // ------------------------------------------------------------------------
    if (pathname === '/api/poa' && method === 'GET') {
      const bulan = url.searchParams.get('bulan');
      const tahun = url.searchParams.get('tahun');
      const nip = url.searchParams.get('nip');

      // Auto-migration: Ensure table poa_bulanan exists with tanggal column
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS poa_bulanan (
            id TEXT PRIMARY KEY,
            tanggal DATE,
            bulan INTEGER NOT NULL,
            tahun INTEGER NOT NULL,
            petugas_nip TEXT NOT NULL,
            petugas_nama TEXT NOT NULL,
            petugas_jabatan TEXT,
            program_kesehatan TEXT DEFAULT 'BOK Puskesmas',
            uraian_kegiatan TEXT NOT NULL,
            keterangan TEXT,
            target_sasaran TEXT,
            lokasi_pelaksanaan TEXT,
            vol_kegiatan INTEGER DEFAULT 1,
            satuan TEXT DEFAULT 'Kegiatan',
            anggaran_bok REAL DEFAULT 0,
            sumber_dana TEXT DEFAULT 'BOK Puskesmas',
            status TEXT DEFAULT 'Aktif',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run();
      } catch (tblErr) {}

      // Add tanggal column if table exists from previous migrations without it
      try {
        await db.prepare(`ALTER TABLE poa_bulanan ADD COLUMN tanggal DATE;`).run();
      } catch (colErr) {}
      try {
        await db.prepare(`ALTER TABLE poa_bulanan ADD COLUMN keterangan TEXT;`).run();
      } catch (colErr) {}

      let query = 'SELECT * FROM poa_bulanan WHERE 1=1';
      const params = [];

      if (bulan && tahun) {
        const mNum = parseInt(bulan, 10);
        const yNum = parseInt(tahun, 10);
        const mStr = String(mNum).padStart(2, '0');
        query += ' AND ((bulan = ? AND tahun = ?) OR (tanggal LIKE ?))';
        params.push(mNum, yNum, `${yNum}-${mStr}-%`);
      }
      if (nip) {
        query += ' AND (petugas_nip = ? OR petugas_nip LIKE ?)';
        params.push(nip, `%${nip}%`);
      }

      query += ' ORDER BY tanggal ASC, created_at DESC';
      const { results } = await db.prepare(query).bind(...params).all();

      const parsed = (results || []).map(r => {
        let b = r.bulan;
        let y = r.tahun;
        if (r.tanggal && typeof r.tanggal === 'string' && r.tanggal.includes('-')) {
          const p = r.tanggal.split('-');
          y = parseInt(p[0], 10) || y;
          b = parseInt(p[1], 10) || b;
        }
        return {
          ...r,
          bulan: b,
          tahun: y
        };
      });

      return jsonResponse({ success: true, total: parsed.length, data: parsed });
    }

    if (pathname === '/api/poa/save' && method === 'POST') {
      const item = await request.json();
      const nipClean = (item.petugas_nip || item.nip || 'user').replace(/[^a-zA-Z0-9]/g, '');
      const id = item.id || `poa-${item.tanggal || Date.now()}-${nipClean}`;
      
      let bulan = parseInt(item.bulan, 10);
      let tahun = parseInt(item.tahun, 10);
      if (isNaN(bulan) || isNaN(tahun)) {
        if (item.tanggal && typeof item.tanggal === 'string' && item.tanggal.includes('-')) {
          const parts = item.tanggal.split('-');
          tahun = isNaN(tahun) ? parseInt(parts[0], 10) : tahun;
          bulan = isNaN(bulan) ? parseInt(parts[1], 10) : bulan;
        } else {
          const now = new Date();
          bulan = now.getMonth() + 1;
          tahun = now.getFullYear();
        }
      }

      // Auto-migration
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS poa_bulanan (
            id TEXT PRIMARY KEY,
            tanggal DATE,
            bulan INTEGER NOT NULL,
            tahun INTEGER NOT NULL,
            petugas_nip TEXT NOT NULL,
            petugas_nama TEXT NOT NULL,
            petugas_jabatan TEXT,
            program_kesehatan TEXT DEFAULT 'BOK Puskesmas',
            uraian_kegiatan TEXT NOT NULL,
            keterangan TEXT,
            target_sasaran TEXT,
            lokasi_pelaksanaan TEXT,
            vol_kegiatan INTEGER DEFAULT 1,
            satuan TEXT DEFAULT 'Kegiatan',
            anggaran_bok REAL DEFAULT 0,
            sumber_dana TEXT DEFAULT 'BOK Puskesmas',
            status TEXT DEFAULT 'Aktif',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `).run();
      } catch (tblErr) {}

      // Add tanggal column if missing
      try {
        await db.prepare(`ALTER TABLE poa_bulanan ADD COLUMN tanggal DATE;`).run();
      } catch (colErr) {}
      try {
        await db.prepare(`ALTER TABLE poa_bulanan ADD COLUMN keterangan TEXT;`).run();
      } catch (colErr) {}

      await db.prepare(`
        INSERT INTO poa_bulanan (id, tanggal, bulan, tahun, petugas_nip, petugas_nama, petugas_jabatan, program_kesehatan, uraian_kegiatan, keterangan, target_sasaran, lokasi_pelaksanaan, vol_kegiatan, satuan, anggaran_bok, sumber_dana, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          tanggal = excluded.tanggal,
          bulan = excluded.bulan,
          tahun = excluded.tahun,
          petugas_nip = excluded.petugas_nip,
          petugas_nama = excluded.petugas_nama,
          petugas_jabatan = excluded.petugas_jabatan,
          program_kesehatan = excluded.program_kesehatan,
          uraian_kegiatan = excluded.uraian_kegiatan,
          keterangan = excluded.keterangan,
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
        item.tanggal || '',
        bulan,
        tahun,
        item.petugas_nip || item.nip || '',
        item.petugas_nama || item.nama || '',
        item.petugas_jabatan || item.jabatan || '',
        item.program_kesehatan || item.program || 'BOK Puskesmas',
        item.uraian_kegiatan || item.uraian || item.kegiatan || item.nama_kegiatan || '',
        item.keterangan || '',
        item.target_sasaran || '',
        item.lokasi_pelaksanaan || item.lokasi || 'Puskesmas / Wilayah Kerja',
        parseInt(item.vol_kegiatan) || 1,
        item.satuan || 'Kegiatan',
        parseFloat(item.anggaran_bok) || 0,
        item.sumber_dana || 'BOK Puskesmas',
        item.status || 'Aktif'
      ).run();

      return jsonResponse({ success: true, message: 'POA Bulanan berhasil disimpan ke Cloudflare D1!', id });
    }

    if (pathname === '/api/poa/delete' && (method === 'DELETE' || method === 'POST')) {
      const body = await request.json();
      const { id } = body;

      if (!id) {
        return jsonResponse({ success: false, error: 'ID POA wajib disertakan!' }, 400);
      }

      await db.prepare('DELETE FROM poa_bulanan WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: `Data POA [${id}] berhasil dihapus dari Cloudflare D1.` });
    }

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // 6. TP POL JASPEL (/api/tppol, /api/tppol/save)
    // ------------------------------------------------------------------------
    if (pathname === '/api/tppol' && method === 'GET') {
      try {
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
          query += ' AND (petugas_nip = ? OR petugas_nip LIKE ?)';
          params.push(nip, `%${nip}%`);
        }

        query += ' ORDER BY created_at DESC';
        const { results } = await db.prepare(query).bind(...params).all();
        
        const cleanResults = (results || []).map(r => {
          if (!r.form_data && r.catatan && r.catatan.startsWith('FORM_DATA:')) {
            r.form_data = r.catatan.substring(10);
          }
          return r;
        });

        return jsonResponse({ success: true, total: cleanResults.length, data: cleanResults });
      } catch (err) {
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    if (pathname === '/api/tppol/save' && method === 'POST') {
      try {
        const item = await request.json();
        const id = item.id || `tppol-${item.petugas_nip || 'user'}-${item.bulan || '0'}-${item.tahun || '2026'}`;
        const bulan = parseInt(item.bulan) || (new Date().getMonth() + 1);
        const tahun = parseInt(item.tahun) || new Date().getFullYear();
        const formDataStr = typeof item.form_data === 'object' ? JSON.stringify(item.form_data) : (item.form_data || '');

        // Auto-migration: Ensure table exists
        try {
          await db.prepare(`
            CREATE TABLE IF NOT EXISTS tppol_jaspel (
              id TEXT PRIMARY KEY,
              bulan INTEGER NOT NULL,
              tahun INTEGER NOT NULL,
              petugas_nip TEXT NOT NULL,
              petugas_nama TEXT NOT NULL,
              petugas_jabatan TEXT NOT NULL,
              skor_kehadiran REAL DEFAULT 100.0,
              skor_pelayanan REAL DEFAULT 95.0,
              skor_administrasi REAL DEFAULT 90.0,
              skor_perilaku REAL DEFAULT 95.0,
              total_skor REAL DEFAULT 95.0,
              catatan TEXT,
              form_data TEXT,
              status_verifikasi TEXT DEFAULT 'Terverifikasi',
              verified_by TEXT,
              verified_at DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `).run();
        } catch (tblErr) {}

        // Auto-migration: Ensure form_data column exists
        try {
          await db.prepare(`ALTER TABLE tppol_jaspel ADD COLUMN form_data TEXT;`).run();
        } catch (colErr) {}

        try {
          await db.prepare(`
            INSERT INTO tppol_jaspel (id, bulan, tahun, petugas_nip, petugas_nama, petugas_jabatan, skor_kehadiran, skor_pelayanan, skor_administrasi, skor_perilaku, total_skor, catatan, form_data, status_verifikasi, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              bulan = excluded.bulan,
              tahun = excluded.tahun,
              petugas_nama = excluded.petugas_nama,
              petugas_jabatan = excluded.petugas_jabatan,
              skor_kehadiran = excluded.skor_kehadiran,
              skor_pelayanan = excluded.skor_pelayanan,
              skor_administrasi = excluded.skor_administrasi,
              skor_perilaku = excluded.skor_perilaku,
              total_skor = excluded.total_skor,
              catatan = excluded.catatan,
              form_data = excluded.form_data,
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
            formDataStr,
            item.status_verifikasi || 'Terverifikasi'
          ).run();
        } catch (insertErr) {
          // Fallback if form_data is still blocked: store in catatan column
          await db.prepare(`
            INSERT INTO tppol_jaspel (id, bulan, tahun, petugas_nip, petugas_nama, petugas_jabatan, skor_kehadiran, skor_pelayanan, skor_administrasi, skor_perilaku, total_skor, catatan, status_verifikasi, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              bulan = excluded.bulan,
              tahun = excluded.tahun,
              petugas_nama = excluded.petugas_nama,
              petugas_jabatan = excluded.petugas_jabatan,
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
            formDataStr ? `FORM_DATA:${formDataStr}` : (item.catatan || ''),
            item.status_verifikasi || 'Terverifikasi'
          ).run();
        }

        return jsonResponse({ success: true, message: 'Scoring TP POL berhasil disimpan ke Cloudflare D1!', id });
      } catch (err) {
        return jsonResponse({ success: false, error: err.message }, 500);
      }
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
    // 8. AUDIT LOGS (/api/audit-logs)
    // ------------------------------------------------------------------------
    if (pathname === '/api/audit-logs' && method === 'GET') {
      const { results } = await db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200').all();
      return jsonResponse({ success: true, total: results.length, data: results });
    }

    // ------------------------------------------------------------------------
    // 9. SUPER ADMIN SQL RUNNER CONSOLE (/api/sql)
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
