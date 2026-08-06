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

    // Serve static assets via Cloudflare Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
