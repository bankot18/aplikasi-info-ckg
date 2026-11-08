// Cloudflare Pages Function: API Endpoint for CKG Gratis Records (/api/ckg-gratis)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding (DB) not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS ckg_gratis_records (
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

    const { results } = await env.DB.prepare('SELECT * FROM ckg_gratis_records ORDER BY rowid DESC').all();
    const parsed = (results || []).map(r => {
      let item = {};
      if (r.raw_json) {
        try { item = JSON.parse(r.raw_json); } catch (_) {}
      }
      return {
        ...item,
        id: item.id || (r.id ? (String(r.id).startsWith('CKG-G-') ? String(r.id) : `CKG-G-${r.id}`) : 'CKG-G-' + Date.now()),
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

    return new Response(JSON.stringify({ success: true, count: parsed.length, data: parsed }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding (DB) not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS ckg_gratis_records (
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

    const body = await request.json();
    const records = Array.isArray(body) ? body : [body];

    const stmt = env.DB.prepare(`
      INSERT INTO ckg_gratis_records (id, nik, nama_pasien, petugas_entry, tanggal_entry, lokasi_pelayanan, status_entry, raw_json)
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
      const recId = String(r.id || (r.nik ? `CKG-G-${r.nik}` : `CKG-G-${Date.now()}-${Math.floor(Math.random()*10000)}`));
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

    const chunkSize = 20;
    for (let i = 0; i < statements.length; i += chunkSize) {
      const chunk = statements.slice(i, i + chunkSize);
      await env.DB.batch(chunk);
    }

    return new Response(JSON.stringify({ success: true, count: records.length }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding (DB) not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    let body = null;
    try {
      if (request.headers.get('content-type')?.includes('application/json')) {
        body = await request.json();
      }
    } catch (_) {}

    const id = url.searchParams.get('id') || body?.id;
    const filter = url.searchParams.get('filter') || body?.filter;

    if (id) {
      await env.DB.prepare('DELETE FROM ckg_gratis_records WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true, deleted: 'single' }), { headers: corsHeaders });
    } else if (body && Array.isArray(body.ids) && body.ids.length > 0) {
      const batchSize = 50;
      let totalDeleted = 0;
      for (let i = 0; i < body.ids.length; i += batchSize) {
        const chunk = body.ids.slice(i, i + batchSize);
        const placeholders = chunk.map(() => '?').join(',');
        await env.DB.prepare(`DELETE FROM ckg_gratis_records WHERE id IN (${placeholders})`).bind(...chunk).run();
        totalDeleted += chunk.length;
      }
      return new Response(JSON.stringify({ success: true, deleted: 'batch', count: totalDeleted }), { headers: corsHeaders });
    } else if (filter === 'non_16_digit') {
      const delRes = await env.DB.prepare(`
        DELETE FROM ckg_gratis_records 
        WHERE (nik IS NOT NULL AND TRIM(nik) != '' AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(nik, ' ', ''), '-', ''), '.', ''), '\'', '')) != 16)
      `).run();
      return new Response(JSON.stringify({ success: true, deleted: 'non_16_digit', changes: delRes?.meta?.changes }), { headers: corsHeaders });
    } else {
      await env.DB.prepare('DELETE FROM ckg_gratis_records').run();
      return new Response(JSON.stringify({ success: true, deleted: 'all' }), { headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
