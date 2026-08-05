// Cloudflare Pages Function: API Endpoint for CKG Records (/api/ckg)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const { results } = await env.DB.prepare('SELECT * FROM ckg_records ORDER BY id DESC').all();
    return new Response(JSON.stringify({ success: true, count: results ? results.length : 0, data: results || [] }), {
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

    return new Response(JSON.stringify({ success: true, inserted: records.length }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
