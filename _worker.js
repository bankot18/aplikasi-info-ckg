// Cloudflare Workers Module Entry Point with D1 Database API Router

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. ROUTE: /api/users
    if (url.pathname === '/api/users' || url.pathname.startsWith('/api/users/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), {
          status: 500,
          headers: corsHeaders
        });
      }

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT nama_user, password, role FROM users ORDER BY id ASC').all();
          return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const users = Array.isArray(body) ? body : [body];
          const stmt = env.DB.prepare(`
            INSERT INTO users (nama_user, password, role) VALUES (?, ?, ?)
            ON CONFLICT(nama_user) DO UPDATE SET
              password = excluded.password,
              role = excluded.role
          `);
          const statements = users.map(u => stmt.bind(u.nama_user, u.password || '', u.role || 'Petugas'));
          await env.DB.batch(statements);
          return new Response(JSON.stringify({ success: true, count: users.length }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const nama_user = url.searchParams.get('nama_user');
          if (!nama_user) {
            return new Response(JSON.stringify({ success: false, error: 'nama_user parameter required' }), { status: 400, headers: corsHeaders });
          }
          await env.DB.prepare('DELETE FROM users WHERE nama_user = ?').bind(nama_user).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }
    }

    // 2. ROUTE: /api/simpus
    if (url.pathname === '/api/simpus' || url.pathname.startsWith('/api/simpus/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), {
          status: 500,
          headers: corsHeaders
        });
      }

      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS simpus_records (
            id TEXT PRIMARY KEY,
            no INTEGER,
            petugas_entry TEXT,
            nama TEXT,
            nik TEXT,
            tanggal TEXT,
            dob TEXT,
            usia INTEGER,
            status_pernikahan TEXT,
            provinsi TEXT,
            kab_kota TEXT,
            kecamatan TEXT,
            kelurahan TEXT,
            alamat TEXT,
            bb REAL,
            tb REAL,
            imt REAL,
            sistol INTEGER,
            diastol INTEGER,
            gula TEXT,
            kolesterol TEXT,
            keterangan TEXT,
            is_divided INTEGER DEFAULT 0,
            assigned_to TEXT,
            entry_status TEXT DEFAULT 'belum',
            raw_json TEXT
          )
        `).run();
      } catch (_) {}

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM simpus_records ORDER BY no ASC').all();
          const formatted = (results || []).map(r => {
            let item = {};
            if (r.raw_json) {
              try { item = JSON.parse(r.raw_json); } catch (_) {}
            }
            return {
              ...item,
              ...r,
              id: String(r.id || item.id || Date.now()),
              petugas_entry: r.petugas_entry || item.petugas_entry || r.assigned_to || item.assigned_to || '',
              nama: r.nama || item.nama || '',
              nik: r.nik || item.nik || '',
              status_pernikahan: r.status_pernikahan || item.status_pernikahan || 'MENIKAH',
              provinsi: r.provinsi || item.provinsi || 'Jawa Barat',
              kab_kota: r.kab_kota || item.kab_kota || 'Kab. Bandung',
              kecamatan: r.kecamatan || item.kecamatan || 'Banjaran',
              kelurahan: r.kelurahan || item.kelurahan || 'Tarajusari',
              alamat: r.alamat || item.alamat || '-',
              is_divided: Boolean(r.is_divided === 1 || r.is_divided === '1' || r.is_divided === true),
              assigned_to: r.assigned_to || item.assigned_to || r.petugas_entry || item.petugas_entry || '',
              entry_status: r.entry_status || item.entry_status || 'belum'
            };
          });
          return new Response(JSON.stringify({ success: true, count: formatted.length, data: formatted }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const records = Array.isArray(body) ? body : [body];
          const stmt = env.DB.prepare(`
            INSERT INTO simpus_records (
              id, no, petugas_entry, nama, nik, tanggal, dob, usia, status_pernikahan,
              provinsi, kab_kota, kecamatan, kelurahan, alamat, bb, tb, imt,
              sistol, diastol, gula, kolesterol, keterangan, is_divided, assigned_to, entry_status, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              no = excluded.no,
              petugas_entry = excluded.petugas_entry,
              nama = excluded.nama,
              nik = excluded.nik,
              tanggal = excluded.tanggal,
              dob = excluded.dob,
              usia = excluded.usia,
              status_pernikahan = excluded.status_pernikahan,
              provinsi = excluded.provinsi,
              kab_kota = excluded.kab_kota,
              kecamatan = excluded.kecamatan,
              kelurahan = excluded.kelurahan,
              alamat = excluded.alamat,
              bb = excluded.bb,
              tb = excluded.tb,
              imt = excluded.imt,
              sistol = excluded.sistol,
              diastol = excluded.diastol,
              gula = excluded.gula,
              kolesterol = excluded.kolesterol,
              keterangan = excluded.keterangan,
              is_divided = excluded.is_divided,
              assigned_to = excluded.assigned_to,
              entry_status = excluded.entry_status,
              raw_json = excluded.raw_json
          `);
          const statements = records.map(r => stmt.bind(
            String(r.id || r.nik || Date.now()), r.no || 0, r.petugas_entry || r.assigned_to || '', r.nama || '', r.nik || '',
            r.tanggal || '', r.dob || '', r.usia || 0, r.status_pernikahan || 'MENIKAH',
            r.provinsi || 'Jawa Barat', r.kab_kota || 'Kab. Bandung', r.kecamatan || 'Banjaran', r.kelurahan || 'Tarajusari', r.alamat || '',
            r.bb || 0, r.tb || 0, r.imt || 0, r.sistol || 0, r.diastol || 0, r.gula || '-', r.kolesterol || '-',
            r.keterangan || 'Dewasa', r.is_divided ? 1 : 0, r.assigned_to || r.petugas_entry || '', r.entry_status || 'belum',
            JSON.stringify(r)
          ));
          const chunkSize = 20;
          for (let i = 0; i < statements.length; i += chunkSize) {
            const chunk = statements.slice(i, i + chunkSize);
            await env.DB.batch(chunk);
          }
          return new Response(JSON.stringify({ success: true, count: records.length }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id');
          if (id) {
            await env.DB.prepare('DELETE FROM simpus_records WHERE id = ?').bind(id).run();
          } else {
            await env.DB.prepare('DELETE FROM simpus_records').run();
          }
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }
    }

    // 3. ROUTE: /api/ckg
    if (url.pathname === '/api/ckg' || url.pathname.startsWith('/api/ckg/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), {
          status: 500,
          headers: corsHeaders
        });
      }

      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS ckg_full_records (
            id TEXT PRIMARY KEY,
            nik TEXT,
            nama_pasien TEXT,
            petugas_entry TEXT,
            tanggal_entry TEXT,
            lokasi_pelayanan TEXT,
            status_entry TEXT,
            raw_json TEXT
          )
        `).run();
      } catch (_) {}

      if (request.method === 'GET') {
        try {
          let { results } = await env.DB.prepare('SELECT * FROM ckg_full_records ORDER BY rowid DESC').all();
          if (!results || results.length === 0) {
            try {
              const legacy = await env.DB.prepare('SELECT * FROM ckg_records ORDER BY id DESC').all();
              if (legacy && legacy.results && legacy.results.length > 0) {
                results = legacy.results;
              }
            } catch (_) {}
          }

          const parsed = (results || []).map(r => {
            let item = {};
            if (r.raw_json) {
              try { item = JSON.parse(r.raw_json); } catch (_) {}
            }
            return {
              ...item,
              id: item.id || (r.id ? (String(r.id).startsWith('CKG-') ? String(r.id) : `CKG-${r.id}`) : 'CKG-' + Date.now()),
              nik: item.nik || r.nik || '',
              nama: item.nama || item.nama_pasien || r.nama_pasien || '',
              petugas_entry: item.petugas_entry || r.petugas_entry || 'Admin',
              created_by: item.created_by || r.petugas_entry || 'Admin',
              tanggal_entry: item.tanggal_entry || r.tanggal_entry || '',
              created_at: item.created_at || r.tanggal_entry || '',
              jenis_kegiatan: item.jenis_kegiatan || r.lokasi_pelayanan || 'Luar Gedung',
              status_validasi: item.status_validasi || r.status_entry || 'Terverifikasi'
            };
          });
          return new Response(JSON.stringify({ success: true, count: parsed.length, data: parsed }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const records = Array.isArray(body) ? body : [body];
          const stmt = env.DB.prepare(`
            INSERT INTO ckg_full_records (id, nik, nama_pasien, petugas_entry, tanggal_entry, lokasi_pelayanan, status_entry, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              nik = excluded.nik,
              nama_pasien = excluded.nama_pasien,
              petugas_entry = excluded.petugas_entry,
              tanggal_entry = excluded.tanggal_entry,
              lokasi_pelayanan = excluded.lokasi_pelayanan,
              status_entry = excluded.status_entry,
              raw_json = excluded.raw_json
          `);
          const statements = records.map(r => {
            const recId = String(r.id || (r.nik ? `CKG-${r.nik}` : `CKG-${Date.now()}-${Math.floor(Math.random()*10000)}`));
            return stmt.bind(
              recId,
              r.nik || '',
              r.nama || r.nama_pasien || '',
              r.petugas_entry || r.created_by || 'Admin',
              r.created_at || r.tanggal_entry || new Date().toISOString().substring(0, 10),
              r.jenis_kegiatan || r.lokasi_pelayanan || 'Luar Gedung',
              r.status_validasi || r.status_entry || 'Terverifikasi',
              JSON.stringify(r)
            );
          });
          
          // Chunk statements into max 20 per batch call for D1 reliability
          const chunkSize = 20;
          for (let i = 0; i < statements.length; i += chunkSize) {
            const chunk = statements.slice(i, i + chunkSize);
            await env.DB.batch(chunk);
          }

          return new Response(JSON.stringify({ success: true, count: records.length }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id');
          if (id) {
            await env.DB.prepare('DELETE FROM ckg_full_records WHERE id = ?').bind(id).run();
            try { await env.DB.prepare('DELETE FROM ckg_records WHERE id = ?').bind(id).run(); } catch (_) {}
          } else {
            await env.DB.prepare('DELETE FROM ckg_full_records').run();
            // Also clear legacy ckg_records table to prevent data resurrection
            try { await env.DB.prepare('DELETE FROM ckg_records').run(); } catch (_) {}
          }
          return new Response(JSON.stringify({ success: true, deleted: id ? 'single' : 'all' }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }
    }

    // 4. ROUTE: /api/sekolah (CKG Sekolah Database)
    if (url.pathname === '/api/sekolah' || url.pathname.startsWith('/api/sekolah/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
      }

      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS ckg_sekolah_records (
            id TEXT PRIMARY KEY,
            nama_sekolah TEXT,
            nama_siswa TEXT,
            nisn_nik TEXT,
            kelas TEXT,
            jenis_kelamin TEXT DEFAULT 'L',
            hb TEXT DEFAULT '-',
            status_gizi TEXT DEFAULT 'Normal',
            petugas_entry TEXT,
            tanggal_entry TEXT,
            raw_json TEXT
          )
        `).run();
      } catch (_) {}

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM ckg_sekolah_records ORDER BY rowid DESC').all();
          const parsed = (results || []).map(r => {
            let json = {};
            try { json = JSON.parse(r.raw_json || '{}'); } catch (_) {}
            return { ...json, ...r };
          });
          return new Response(JSON.stringify({ success: true, count: parsed.length, data: parsed }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const items = Array.isArray(body) ? body : [body];
          const stmt = env.DB.prepare(`
            INSERT INTO ckg_sekolah_records (id, nama_sekolah, nama_siswa, nisn_nik, kelas, jenis_kelamin, hb, status_gizi, petugas_entry, tanggal_entry, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              nama_sekolah = excluded.nama_sekolah,
              nama_siswa = excluded.nama_siswa,
              nisn_nik = excluded.nisn_nik,
              kelas = excluded.kelas,
              jenis_kelamin = excluded.jenis_kelamin,
              hb = excluded.hb,
              status_gizi = excluded.status_gizi,
              petugas_entry = excluded.petugas_entry,
              tanggal_entry = excluded.tanggal_entry,
              raw_json = excluded.raw_json
          `);
          const statements = items.map(item => stmt.bind(
            String(item.id || item.nisn_nik || Date.now()),
            item.nama_sekolah || '',
            item.nama_siswa || item.nama || '',
            item.nisn_nik || item.nik || '',
            item.kelas || '',
            item.jenis_kelamin || 'L',
            item.hb || '-',
            item.status_gizi || 'Normal',
            item.petugas_entry || 'Admin',
            item.tanggal_entry || new Date().toISOString().substring(0, 10),
            JSON.stringify(item)
          ));
          await env.DB.batch(statements);
          return new Response(JSON.stringify({ success: true, count: items.length }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id');
          if (id) {
            await env.DB.prepare('DELETE FROM ckg_sekolah_records WHERE id = ?').bind(id).run();
          } else {
            await env.DB.prepare('DELETE FROM ckg_sekolah_records').run();
          }
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }
    }

    // 4. ROUTE: /api/recycle
    if (url.pathname === '/api/recycle' || url.pathname.startsWith('/api/recycle/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
      }

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM recycle_bin ORDER BY created_at DESC').all();
          const parsed = (results || []).map(r => {
            let json = {};
            try { json = JSON.parse(r.raw_json || '{}'); } catch (_) {}
            return {
              ...json,
              id: r.id,
              nik: r.nik,
              nama: r.nama,
              jenis_kegiatan: r.jenis_kegiatan,
              deleted_at: r.deleted_at,
              deleted_by: r.deleted_by,
              original_source: r.original_source
            };
          });
          return new Response(JSON.stringify({ success: true, count: parsed.length, data: parsed }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const items = Array.isArray(body) ? body : [body];
          const stmt = env.DB.prepare(`
            INSERT INTO recycle_bin (id, nik, nama, jenis_kegiatan, deleted_at, deleted_by, original_source, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              deleted_at = excluded.deleted_at,
              deleted_by = excluded.deleted_by,
              raw_json = excluded.raw_json
          `);
          const statements = items.map(item => stmt.bind(
            String(item.id || item.nik || Date.now()),
            item.nik || '',
            item.nama || item.nama_pasien || '',
            item.jenis_kegiatan || '',
            item.deleted_at || new Date().toISOString(),
            item.deleted_by || 'Admin',
            item.original_source || 'BNBA CKG',
            JSON.stringify(item)
          ));
          await env.DB.batch(statements);
          return new Response(JSON.stringify({ success: true, count: items.length }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id');
          if (id) {
            await env.DB.prepare('DELETE FROM recycle_bin WHERE id = ?').bind(id).run();
          } else {
            await env.DB.prepare('DELETE FROM recycle_bin').run();
          }
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }
    }

    // 5. ROUTE: /api/announcement
    if (url.pathname === '/api/announcement' || url.pathname.startsWith('/api/announcement/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
      }

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM announcement WHERE id = 1 LIMIT 1').all();
          const ann = results && results.length > 0 ? results[0] : null;
          if (ann) {
            ann.active = Boolean(ann.active);
          }
          return new Response(JSON.stringify({ success: true, data: ann }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          await env.DB.prepare(`
            INSERT INTO announcement (id, title, content, author, date, active)
            VALUES (1, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              content = excluded.content,
              author = excluded.author,
              date = excluded.date,
              active = excluded.active
          `).bind(
            body.title || 'PENGUMUMAN SISTEM CKG',
            body.content || '',
            body.author || 'Admin',
            body.date || new Date().toISOString().substring(0, 10),
            body.active ? 1 : 0
          ).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }
    }

    // 6. ROUTE: /api/sessions (Live User Session & Heartbeat Tracker)
    if (url.pathname === '/api/sessions' || url.pathname.startsWith('/api/sessions/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
      }

      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS user_sessions (
            nama_user TEXT PRIMARY KEY,
            last_seen INTEGER NOT NULL,
            status TEXT DEFAULT 'active'
          )
        `).run();
      } catch (_) {}

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT nama_user, last_seen, status FROM user_sessions').all();
          return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const nama_user = body.nama_user || body.nama;
          const status = body.status || 'active';
          const now = Date.now();

          if (!nama_user) {
            return new Response(JSON.stringify({ success: false, error: 'nama_user required' }), { status: 400, headers: corsHeaders });
          }

          await env.DB.prepare(`
            INSERT INTO user_sessions (nama_user, last_seen, status)
            VALUES (?, ?, ?)
            ON CONFLICT(nama_user) DO UPDATE SET
              last_seen = excluded.last_seen,
              status = excluded.status
          `).bind(nama_user, now, status).run();

          return new Response(JSON.stringify({ success: true, timestamp: now }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }
    }

    // Serve static assets via Cloudflare Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
