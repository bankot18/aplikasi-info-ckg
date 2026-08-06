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

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM simpus_records ORDER BY no ASC').all();
          const formatted = (results || []).map(r => ({
            ...r,
            is_divided: Boolean(r.is_divided)
          }));
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
              id, no, tanggal, nama, nik, alamat, dob, usia, bb, tb, imt,
              sistol, diastol, gula, kolesterol, keterangan, is_divided, assigned_to, entry_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              is_divided = excluded.is_divided,
              assigned_to = excluded.assigned_to,
              entry_status = excluded.entry_status
          `);
          const statements = records.map(r => stmt.bind(
            r.id, r.no || 0, r.tanggal || '', r.nama || '', r.nik || '',
            r.alamat || '', r.dob || '', r.usia || 0, r.bb || 0, r.tb || 0, r.imt || 0,
            r.sistol || 0, r.diastol || 0, r.gula || '-', r.kolesterol || '-',
            r.keterangan || 'Dewasa', r.is_divided ? 1 : 0, r.assigned_to || '', r.entry_status || 'belum'
          ));
          await env.DB.batch(statements);
          return new Response(JSON.stringify({ success: true, count: records.length }), { headers: corsHeaders });
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

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM ckg_records ORDER BY id DESC').all();
          return new Response(JSON.stringify({ success: true, count: results ? results.length : 0, data: results || [] }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const records = Array.isArray(body) ? body : [body];
          const stmt = env.DB.prepare(`
            INSERT INTO ckg_records (tanggal_entry, nik, nama_pasien, petugas_entry, lokasi_pelayanan, status_entry)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          const statements = records.map(r => stmt.bind(
            r.tanggal_entry || new Date().toLocaleDateString('id-ID'),
            r.nik || '',
            r.nama_pasien || r.nama || '',
            r.petugas_entry || r.assigned_to || '',
            r.lokasi_pelayanan || 'Luar Gedung',
            r.status_entry || 'Berhasil di Entry'
          ));
          await env.DB.batch(statements);
          return new Response(JSON.stringify({ success: true, count: records.length }), { headers: corsHeaders });
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
