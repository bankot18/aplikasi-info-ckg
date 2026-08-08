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

    // Ping route for latency checking
    if (url.pathname === '/api/ping') {
      return new Response(JSON.stringify({ success: true, timestamp: Date.now() }), { headers: corsHeaders });
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

    // 2. ROUTE: /api/simpus (Split: simpus_belum_bagi & simpus_sudah_bagi)
    if (url.pathname === '/api/simpus' || url.pathname.startsWith('/api/simpus/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), {
          status: 500, headers: corsHeaders
        });
      }

      // Auto-create both tables & high-performance indexes
      try {
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS simpus_belum_bagi (
          id TEXT PRIMARY KEY, no INTEGER, nama TEXT, nik TEXT, tanggal TEXT, dob TEXT,
          usia INTEGER, status_pernikahan TEXT, provinsi TEXT, kab_kota TEXT, kecamatan TEXT,
          kelurahan TEXT, alamat TEXT, bb REAL, tb REAL, imt REAL, sistol INTEGER, diastol INTEGER,
          gula TEXT, kolesterol TEXT, keterangan TEXT, entry_status TEXT DEFAULT 'belum', raw_json TEXT
        )`).run();
      } catch (_) {}
      try {
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS simpus_sudah_bagi (
          id TEXT PRIMARY KEY, no INTEGER, petugas_entry TEXT, assigned_to TEXT,
          nama TEXT, nik TEXT, tanggal TEXT, dob TEXT, usia INTEGER, status_pernikahan TEXT,
          provinsi TEXT, kab_kota TEXT, kecamatan TEXT, kelurahan TEXT, alamat TEXT,
          bb REAL, tb REAL, imt REAL, sistol INTEGER, diastol INTEGER,
          gula TEXT, kolesterol TEXT, keterangan TEXT, entry_status TEXT DEFAULT 'belum', raw_json TEXT
        )`).run();
      } catch (_) {}
      try {
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_simpus_sudah_assigned ON simpus_sudah_bagi(assigned_to)').run();
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_simpus_sudah_nik ON simpus_sudah_bagi(nik)').run();
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_simpus_sudah_tanggal ON simpus_sudah_bagi(tanggal)').run();
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_simpus_belum_nik ON simpus_belum_bagi(nik)').run();
      } catch (_) {}

      // One-time migration from old simpus_records table
      try {
        const { results: check } = await env.DB.prepare('SELECT COUNT(*) as cnt FROM simpus_records').all();
        if (check && check[0] && check[0].cnt > 0) {
          try {
            await env.DB.prepare(`INSERT OR IGNORE INTO simpus_belum_bagi
              (id,no,nama,nik,tanggal,dob,usia,status_pernikahan,provinsi,kab_kota,kecamatan,kelurahan,alamat,bb,tb,imt,sistol,diastol,gula,kolesterol,keterangan,entry_status,raw_json)
              SELECT id,no,nama,nik,tanggal,dob,usia,status_pernikahan,provinsi,kab_kota,kecamatan,kelurahan,alamat,bb,tb,imt,sistol,diastol,gula,kolesterol,keterangan,entry_status,raw_json
              FROM simpus_records WHERE is_divided = 0 OR is_divided IS NULL`).run();
          } catch (_) {}
          try {
            await env.DB.prepare(`INSERT OR IGNORE INTO simpus_sudah_bagi
              (id,no,petugas_entry,assigned_to,nama,nik,tanggal,dob,usia,status_pernikahan,provinsi,kab_kota,kecamatan,kelurahan,alamat,bb,tb,imt,sistol,diastol,gula,kolesterol,keterangan,entry_status,raw_json)
              SELECT id,no,petugas_entry,assigned_to,nama,nik,tanggal,dob,usia,status_pernikahan,provinsi,kab_kota,kecamatan,kelurahan,alamat,bb,tb,imt,sistol,diastol,gula,kolesterol,keterangan,entry_status,raw_json
              FROM simpus_records WHERE is_divided = 1`).run();
          } catch (_) {}
          try { await env.DB.prepare('DROP TABLE simpus_records').run(); } catch (_) {}
        }
      } catch (_) {}

      const tab = url.searchParams.get('tab') || '';

      // SUB-ROUTE: /api/simpus/bagi (POST) — Move records from belum to sudah
      if (url.pathname === '/api/simpus/bagi' && request.method === 'POST') {
        try {
          const body = await request.json();
          const ids = body.ids || [];
          const petugas = body.petugas || '';
          if (!petugas || ids.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'petugas and ids required' }), { status: 400, headers: corsHeaders });
          }
          let moved = 0;
          for (const id of ids) {
            try {
              const { results } = await env.DB.prepare('SELECT * FROM simpus_belum_bagi WHERE id = ?').bind(id).all();
              if (results && results.length > 0) {
                const r = results[0];
                await env.DB.prepare(`INSERT INTO simpus_sudah_bagi
                  (id,no,petugas_entry,assigned_to,nama,nik,tanggal,dob,usia,status_pernikahan,provinsi,kab_kota,kecamatan,kelurahan,alamat,bb,tb,imt,sistol,diastol,gula,kolesterol,keterangan,entry_status,raw_json)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                  ON CONFLICT(id) DO UPDATE SET petugas_entry=excluded.petugas_entry, assigned_to=excluded.assigned_to`
                ).bind(
                  r.id, r.no||0, petugas, petugas,
                  r.nama||'', r.nik||'', r.tanggal||'', r.dob||'', r.usia||0,
                  r.status_pernikahan||'MENIKAH', r.provinsi||'Jawa Barat', r.kab_kota||'Kab. Bandung',
                  r.kecamatan||'Banjaran', r.kelurahan||'Tarajusari', r.alamat||'',
                  r.bb||0, r.tb||0, r.imt||0, r.sistol||0, r.diastol||0,
                  r.gula||'-', r.kolesterol||'-', r.keterangan||'Dewasa',
                  r.entry_status||'belum', r.raw_json||'{}'
                ).run();
                await env.DB.prepare('DELETE FROM simpus_belum_bagi WHERE id = ?').bind(id).run();
                moved++;
              }
            } catch (_) {}
          }
          return new Response(JSON.stringify({ success: true, moved }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      // GET
      if (request.method === 'GET') {
        try {
          // Auto cleanup: Ensure records in simpus_sudah_bagi DO NOT exist in simpus_belum_bagi
          try {
            await env.DB.prepare('DELETE FROM simpus_belum_bagi WHERE id IN (SELECT id FROM simpus_sudah_bagi)').run();
            await env.DB.prepare("DELETE FROM simpus_belum_bagi WHERE nik IS NOT NULL AND nik != '' AND nik IN (SELECT nik FROM simpus_sudah_bagi WHERE nik IS NOT NULL AND nik != '')").run();
          } catch (_) {}

          const selectBelum = 'SELECT id, no, nama, nik, tanggal, dob, usia, status_pernikahan, provinsi, kab_kota, kecamatan, kelurahan, alamat, bb, tb, imt, sistol, diastol, gula, kolesterol, keterangan, entry_status FROM simpus_belum_bagi ORDER BY no ASC';
          const selectSudah = 'SELECT id, no, petugas_entry, assigned_to, nama, nik, tanggal, dob, usia, status_pernikahan, provinsi, kab_kota, kecamatan, kelurahan, alamat, bb, tb, imt, sistol, diastol, gula, kolesterol, keterangan, entry_status FROM simpus_sudah_bagi ORDER BY no ASC';

          if (tab === 'belum_bagi') {
            const { results } = await env.DB.prepare(selectBelum).all();
            const data = (results||[]).map(r => ({ ...r, is_divided: false, petugas_entry: '', assigned_to: '' }));
            return new Response(JSON.stringify({ success: true, count: data.length, data }), { headers: corsHeaders });
          } else if (tab === 'sudah_bagi') {
            const { results } = await env.DB.prepare(selectSudah).all();
            const data = (results||[]).map(r => ({ ...r, is_divided: true, petugas_entry: r.petugas_entry||'', assigned_to: r.assigned_to||'' }));
            return new Response(JSON.stringify({ success: true, count: data.length, data }), { headers: corsHeaders });
          } else {
            const { results: b } = await env.DB.prepare(selectBelum).all();
            const { results: s } = await env.DB.prepare(selectSudah).all();
            const data = [
              ...(b||[]).map(r => ({ ...r, is_divided: false, petugas_entry: '', assigned_to: '' })),
              ...(s||[]).map(r => ({ ...r, is_divided: true, petugas_entry: r.petugas_entry||'', assigned_to: r.assigned_to||'' }))
            ];
            return new Response(JSON.stringify({ success: true, count: data.length, data }), { headers: corsHeaders });
          }
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      // POST
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const recs = Array.isArray(body) ? body : [body];
          let inserted = 0;
          const batchSize = 10;

          if (tab === 'sudah_bagi') {
            const sql = `INSERT INTO simpus_sudah_bagi
              (id,no,petugas_entry,assigned_to,nama,nik,tanggal,dob,usia,status_pernikahan,provinsi,kab_kota,kecamatan,kelurahan,alamat,bb,tb,imt,sistol,diastol,gula,kolesterol,keterangan,entry_status,raw_json)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON CONFLICT(id) DO UPDATE SET
                no=excluded.no, petugas_entry=excluded.petugas_entry, assigned_to=excluded.assigned_to,
                nama=excluded.nama, nik=excluded.nik, tanggal=excluded.tanggal, dob=excluded.dob,
                usia=excluded.usia, status_pernikahan=excluded.status_pernikahan,
                provinsi=excluded.provinsi, kab_kota=excluded.kab_kota, kecamatan=excluded.kecamatan,
                kelurahan=excluded.kelurahan, alamat=excluded.alamat, bb=excluded.bb, tb=excluded.tb,
                imt=excluded.imt, sistol=excluded.sistol, diastol=excluded.diastol,
                gula=excluded.gula, kolesterol=excluded.kolesterol, keterangan=excluded.keterangan,
                entry_status=excluded.entry_status, raw_json=excluded.raw_json ;`;
            for (let i = 0; i < recs.length; i += batchSize) {
              const chunk = recs.slice(i, i + batchSize);
              const stmts = chunk.map(r => env.DB.prepare(sql).bind(
                String(r.id||r.nik||`auto-${Date.now()}-${Math.random()}`), r.no||0,
                String(r.petugas_entry||r.assigned_to||''), String(r.assigned_to||r.petugas_entry||''),
                String(r.nama||''), String(r.nik||''), String(r.tanggal||''), String(r.dob||''),
                Number(r.usia)||0, String(r.status_pernikahan||'MENIKAH'),
                String(r.provinsi||'Jawa Barat'), String(r.kab_kota||'Kab. Bandung'),
                String(r.kecamatan||'Banjaran'), String(r.kelurahan||'Tarajusari'), String(r.alamat||''),
                Number(r.bb)||0, Number(r.tb)||0, Number(r.imt)||0,
                Number(r.sistol)||0, Number(r.diastol)||0,
                String(r.gula||'-'), String(r.kolesterol||'-'), String(r.keterangan||'Dewasa'),
                String(r.entry_status||'belum'), JSON.stringify(r)
              ));
              await env.DB.batch(stmts);
              inserted += chunk.length;
            }
            try { await env.DB.prepare('DELETE FROM simpus_belum_bagi WHERE id IN (SELECT id FROM simpus_sudah_bagi)').run(); } catch (_) {}
          } else {
            const sql = `INSERT INTO simpus_belum_bagi
              (id,no,nama,nik,tanggal,dob,usia,status_pernikahan,provinsi,kab_kota,kecamatan,kelurahan,alamat,bb,tb,imt,sistol,diastol,gula,kolesterol,keterangan,entry_status,raw_json)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON CONFLICT(id) DO UPDATE SET
                no=excluded.no, nama=excluded.nama, nik=excluded.nik,
                tanggal=excluded.tanggal, dob=excluded.dob, usia=excluded.usia,
                status_pernikahan=excluded.status_pernikahan,
                provinsi=excluded.provinsi, kab_kota=excluded.kab_kota, kecamatan=excluded.kecamatan,
                kelurahan=excluded.kelurahan, alamat=excluded.alamat, bb=excluded.bb, tb=excluded.tb,
                imt=excluded.imt, sistol=excluded.sistol, diastol=excluded.diastol,
                gula=excluded.gula, kolesterol=excluded.kolesterol, keterangan=excluded.keterangan,
                entry_status=excluded.entry_status, raw_json=excluded.raw_json ;`;
            for (let i = 0; i < recs.length; i += batchSize) {
              const chunk = recs.slice(i, i + batchSize);
              const stmts = chunk.map(r => env.DB.prepare(sql).bind(
                String(r.id||r.nik||`auto-${Date.now()}-${Math.random()}`), r.no||0,
                String(r.nama||''), String(r.nik||''), String(r.tanggal||''), String(r.dob||''),
                Number(r.usia)||0, String(r.status_pernikahan||'MENIKAH'),
                String(r.provinsi||'Jawa Barat'), String(r.kab_kota||'Kab. Bandung'),
                String(r.kecamatan||'Banjaran'), String(r.kelurahan||'Tarajusari'), String(r.alamat||''),
                Number(r.bb)||0, Number(r.tb)||0, Number(r.imt)||0,
                Number(r.sistol)||0, Number(r.diastol)||0,
                String(r.gula||'-'), String(r.kolesterol||'-'), String(r.keterangan||'Dewasa'),
                String(r.entry_status||'belum'), JSON.stringify(r)
              ));
              await env.DB.batch(stmts);
              inserted += chunk.length;
            }
            try { await env.DB.prepare('DELETE FROM simpus_sudah_bagi WHERE id IN (SELECT id FROM simpus_belum_bagi)').run(); } catch (_) {}
          }
          return new Response(JSON.stringify({ success: true, count: inserted }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: String(err.message||err), stack: String(err.stack||'') }), { status: 500, headers: corsHeaders });
        }
      }

      // DELETE
      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id');
          if (tab === 'belum_bagi') {
            if (id) { await env.DB.prepare('DELETE FROM simpus_belum_bagi WHERE id = ?').bind(id).run(); }
            else { await env.DB.prepare('DELETE FROM simpus_belum_bagi').run(); }
          } else if (tab === 'sudah_bagi') {
            if (id) { await env.DB.prepare('DELETE FROM simpus_sudah_bagi WHERE id = ?').bind(id).run(); }
            else { await env.DB.prepare('DELETE FROM simpus_sudah_bagi').run(); }
          } else {
            if (id) {
              await env.DB.prepare('DELETE FROM simpus_belum_bagi WHERE id = ?').bind(id).run();
              await env.DB.prepare('DELETE FROM simpus_sudah_bagi WHERE id = ?').bind(id).run();
            } else {
              await env.DB.prepare('DELETE FROM simpus_belum_bagi').run();
              await env.DB.prepare('DELETE FROM simpus_sudah_bagi').run();
            }
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
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_ckg_nik ON ckg_full_records(nik)').run();
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_ckg_petugas ON ckg_full_records(petugas_entry)').run();
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_ckg_tanggal ON ckg_full_records(tanggal_entry)').run();
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

    // 7. ROUTE: /api/maintenance (Maintenance Mode Settings)
    if (url.pathname === '/api/maintenance' || url.pathname.startsWith('/api/maintenance/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
      }

      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS maintenance_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT
          )
        `).run();
      } catch (_) {}

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT key, value FROM maintenance_settings').all();
          const settings = {};
          (results || []).forEach(r => { settings[r.key] = r.value; });
          return new Response(JSON.stringify({
            success: true,
            maintenance_web: settings['maintenance_web'] === 'true',
            maintenance_web_message: settings['maintenance_web_message'] || 'Sistem sedang dalam maintenance. Silakan coba beberapa saat lagi.',
            locked_menus: settings['locked_menus'] ? JSON.parse(settings['locked_menus']) : [],
            maintenance_menu_message: settings['maintenance_menu_message'] || 'Menu ini sedang dalam maintenance oleh Admin.'
          }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const now = new Date().toISOString();
          const upsert = env.DB.prepare(`
            INSERT INTO maintenance_settings (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
          `);
          const statements = [];

          if (body.maintenance_web !== undefined) {
            statements.push(upsert.bind('maintenance_web', String(body.maintenance_web), now));
          }
          if (body.maintenance_web_message !== undefined) {
            statements.push(env.DB.prepare(`
              INSERT INTO maintenance_settings (key, value, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            `).bind('maintenance_web_message', String(body.maintenance_web_message), now));
          }
          if (body.locked_menus !== undefined) {
            statements.push(env.DB.prepare(`
              INSERT INTO maintenance_settings (key, value, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            `).bind('locked_menus', JSON.stringify(body.locked_menus), now));
          }
          if (body.maintenance_menu_message !== undefined) {
            statements.push(env.DB.prepare(`
              INSERT INTO maintenance_settings (key, value, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            `).bind('maintenance_menu_message', String(body.maintenance_menu_message), now));
          }

          if (statements.length > 0) {
            await env.DB.batch(statements);
          }
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }
    }

    // 8. ROUTE: /api/dukcapil (KTP Verification Service - Built-in NIK Parser)
    if (url.pathname.startsWith('/api/dukcapil')) {
      // Province code dictionary (Kemendagri standard)
      const PROV_MAP = {
        '11':'ACEH','12':'SUMATERA UTARA','13':'SUMATERA BARAT','14':'RIAU',
        '15':'JAMBI','16':'SUMATERA SELATAN','17':'BENGKULU','18':'LAMPUNG',
        '19':'KEP. BANGKA BELITUNG','21':'KEP. RIAU',
        '31':'DKI JAKARTA','32':'JAWA BARAT','33':'JAWA TENGAH',
        '34':'DI YOGYAKARTA','35':'JAWA TIMUR','36':'BANTEN',
        '51':'BALI','52':'NUSA TENGGARA BARAT','53':'NUSA TENGGARA TIMUR',
        '61':'KALIMANTAN BARAT','62':'KALIMANTAN TENGAH','63':'KALIMANTAN SELATAN',
        '64':'KALIMANTAN TIMUR','65':'KALIMANTAN UTARA',
        '71':'SULAWESI UTARA','72':'SULAWESI TENGAH','73':'SULAWESI SELATAN',
        '74':'SULAWESI TENGGARA','75':'GORONTALO','76':'SULAWESI BARAT',
        '81':'MALUKU','82':'MALUKU UTARA','91':'PAPUA','92':'PAPUA BARAT'
      };
      // Kab/Kota codes for Jawa Barat (32)
      const KAB_JABAR = {
        '01':'KAB. BOGOR','02':'KAB. SUKABUMI','03':'KAB. CIANJUR',
        '04':'KAB. BANDUNG','05':'KAB. GARUT','06':'KAB. TASIKMALAYA',
        '07':'KAB. CIAMIS','08':'KAB. KUNINGAN','09':'KAB. CIREBON',
        '10':'KAB. MAJALENGKA','11':'KAB. SUMEDANG','12':'KAB. INDRAMAYU',
        '13':'KAB. SUBANG','14':'KAB. PURWAKARTA','15':'KAB. KARAWANG',
        '16':'KAB. BEKASI','17':'KAB. BANDUNG BARAT','18':'KAB. PANGANDARAN',
        '71':'KOTA BOGOR','72':'KOTA SUKABUMI','73':'KOTA BANDUNG',
        '74':'KOTA CIREBON','75':'KOTA BEKASI','76':'KOTA DEPOK',
        '77':'KOTA CIMAHI','78':'KOTA TASIKMALAYA','79':'KOTA BANJAR'
      };

      function parseNik(nik, nama) {
        if (!nik || nik.length !== 16 || isNaN(nik)) {
          return { valid: false, message: 'Format NIK tidak valid (harus 16 digit angka)' };
        }
        const provCode = nik.substring(0, 2);
        const kabCode = nik.substring(2, 4);
        const kecCode = nik.substring(4, 6);
        let dobDay = parseInt(nik.substring(6, 8));
        const dobMonth = parseInt(nik.substring(8, 10));
        let dobYear = parseInt(nik.substring(10, 12));

        let jenisKelamin = 'Laki-laki';
        if (dobDay > 40) { jenisKelamin = 'Perempuan'; dobDay -= 40; }

        if (dobMonth < 1 || dobMonth > 12 || dobDay < 1 || dobDay > 31) {
          return { valid: false, message: 'Data tanggal lahir dalam NIK tidak valid' };
        }

        const now = new Date();
        const cur2 = parseInt(now.getFullYear().toString().substring(2));
        const fullYear = (dobYear <= cur2) ? (2000 + dobYear) : (1900 + dobYear);
        const fDay = String(dobDay).padStart(2, '0');
        const fMonth = String(dobMonth).padStart(2, '0');
        const tanggalLahir = `${fDay}/${fMonth}/${fullYear}`;

        const bd = new Date(fullYear, dobMonth - 1, dobDay);
        let usia = now.getFullYear() - bd.getFullYear();
        const md = now.getMonth() - bd.getMonth();
        if (md < 0 || (md === 0 && now.getDate() < bd.getDate())) usia--;

        const provinsi = PROV_MAP[provCode] || `PROVINSI (KODE ${provCode})`;
        let kabupaten;
        const KEC_BANDUNG = {
          '05': 'Banjaran', '13': 'Banjaran', '11': 'Arjasari', '12': 'Pameungpeuk',
          '14': 'Cangkuang', '15': 'Soreang', '16': 'Katapang', '17': 'Cimaung',
          '28': 'Baleendah', '29': 'Dayeuhkolot', '30': 'Margahayu', '31': 'Margaasih'
        };
        let kecamatan = `KECAMATAN (KODE ${kecCode})`;
        if (provCode === '32' && kabCode === '04' && KEC_BANDUNG[kecCode]) {
          kecamatan = KEC_BANDUNG[kecCode];
        }

        return {
          valid: true,
          nik,
          namaLengkap: nama ? nama.toUpperCase() : 'DATA DUKCAPIL VERIFIED',
          tempatLahir: kabupaten,
          tanggalLahir,
          usia,
          jenisKelamin,
          alamat: `${kecamatan}, ${kabupaten}, ${provinsi}`,
          kecamatan,
          kelurahan: '-',
          provinsi,
          kabupaten
        };
      }

      // /api/dukcapil/health
      if (url.pathname === '/api/dukcapil/health' || url.pathname === '/api/dukcapil/ping') {
        return new Response(JSON.stringify({
          status: 'UP',
          service: 'Dukcapil KTP Verification Service (Cloudflare Worker)',
          timestamp: new Date().toISOString(),
          engine: 'NIK Parser v2.0 — Built-in Cloudflare Edge'
        }), { headers: corsHeaders });
      }

      // /api/dukcapil/verify-nik
      if (url.pathname === '/api/dukcapil/verify-nik' && request.method === 'POST') {
        try {
          const body = await request.json();
          const nik = String(body.nik || '').trim();
          const nama = String(body.namaLengkap || body.nama || '').trim();
          const result = parseNik(nik, nama);

          return new Response(JSON.stringify({
            valid: result.valid,
            message: result.valid
              ? 'Data NIK valid — diverifikasi oleh Parser NIK Dukcapil (Cloudflare Edge)'
              : (result.message || 'NIK tidak valid'),
            data: result.valid ? result : null,
            timestamp: new Date().toISOString(),
            service: 'Dukcapil Service (Cloudflare Worker)'
          }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ valid: false, message: 'Request tidak valid: ' + err.message }), { status: 400, headers: corsHeaders });
        }
      }

      // /api/dukcapil/check-nik
      if (url.pathname === '/api/dukcapil/check-nik' && request.method === 'POST') {
        try {
          const body = await request.json();
          const nik = String(body.nik || '').trim();
          const isValid = nik.length === 16 && !isNaN(nik);
          return new Response(JSON.stringify({
            exists: isValid,
            nik,
            message: isValid ? 'NIK format valid (16 digit)' : 'NIK format tidak valid',
            service: 'Dukcapil Service (Cloudflare Worker)',
            timestamp: new Date().toISOString()
          }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ exists: false, message: err.message }), { status: 400, headers: corsHeaders });
        }
      }

      // /api/dukcapil/docs
      if (url.pathname === '/api/dukcapil/docs') {
        return new Response(JSON.stringify({
          service: 'Dukcapil KTP Verification Service',
          version: '2.0',
          engine: 'Cloudflare Worker Edge NIK Parser',
          endpoints: [
            { method: 'GET', path: '/api/dukcapil/health', description: 'Health check' },
            { method: 'POST', path: '/api/dukcapil/verify-nik', description: 'Verify NIK + nama' },
            { method: 'POST', path: '/api/dukcapil/check-nik', description: 'Check NIK format validity' },
            { method: 'GET', path: '/api/dukcapil/docs', description: 'API documentation' }
          ]
        }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: 'Dukcapil endpoint not found' }), { status: 404, headers: corsHeaders });
    }

    // 9. ROUTE: /api/kamus (Centralized Address Knowledge Base & Cloud Auto-Learning)
    if (url.pathname === '/api/kamus' || url.pathname.startsWith('/api/kamus/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), {
          status: 500,
          headers: corsHeaders
        });
      }

      // Auto-create table if not existing
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS kamus_alamat (
            keyword TEXT PRIMARY KEY,
            kel TEXT,
            kec TEXT,
            kab TEXT,
            prov TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
      } catch (e) {}

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT keyword, kel, kec, kab, prov FROM kamus_alamat').all();
          return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const items = Array.isArray(body) ? body : [body];
          if (items.length === 0) {
            return new Response(JSON.stringify({ success: true, count: 0 }), { headers: corsHeaders });
          }

          const stmt = env.DB.prepare(`
            INSERT INTO kamus_alamat (keyword, kel, kec, kab, prov) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(keyword) DO UPDATE SET
              kel = excluded.kel,
              kec = excluded.kec,
              kab = excluded.kab,
              prov = excluded.prov,
              updated_at = CURRENT_TIMESTAMP
          `);

          // Chunk operations into batches of 50 to respect D1 limits
          const batchSize = 50;
          for (let i = 0; i < items.length; i += batchSize) {
            const chunk = items.slice(i, i + batchSize);
            const statements = chunk.map(item => stmt.bind(
              String(item.keyword).toUpperCase().trim(),
              item.kel || '',
              item.kec || 'Banjaran',
              item.kab || 'Kabupaten Bandung',
              item.prov || 'Jawa Barat'
            ));
            await env.DB.batch(statements);
          }

          return new Response(JSON.stringify({ success: true, count: items.length }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'DELETE') {
        try {
          await env.DB.prepare('DELETE FROM kamus_alamat').run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
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
